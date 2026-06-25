# CI/CD Pipeline Documentation

## Pipeline Overview

The project uses **GitHub Actions** for continuous integration and continuous deployment.

### Pipeline File
Location: [.github/workflows/cd.yml](.github/workflows/cd.yml)

---

## Pipeline Stages

### 1. Test Stage ✅ 
**Trigger:** Every push to `develop` or `main` branches

**Actions:**
- Checkout code
- Install Node.js 18
- Install backend dependencies
- Run unit tests with coverage
- Run ESLint linter

**Tests Run:**
- 5 Unit tests covering auth, books, borrows, health
- API integration tests with supertest
- Coverage report generation

**Required Secrets:** None

**Fails If:**
- Any test fails
- Linter errors detected
- Dependencies fail to install

---

### 2. Build & Push Stage 🐳
**Trigger:** After test stage passes

**Actions:**
- Set up Docker Buildx (for multi-platform builds)
- Authenticate with GitHub Container Registry (GHCR)
- Build backend Docker image
- Push to `ghcr.io/{owner}/library-devops-backend:{SHA}` and `:latest`
- Build frontend Docker image
- Push to `ghcr.io/{owner}/library-devops-frontend:{SHA}` and `:latest`

**Images:**
```
ghcr.io/yourorg/library-devops-backend:a1b2c3d4...  (commit SHA)
ghcr.io/yourorg/library-devops-backend:latest

ghcr.io/yourorg/library-devops-frontend:a1b2c3d4...  (commit SHA)
ghcr.io/yourorg/library-devops-frontend:latest
```

**Required Secrets:** 
- `GITHUB_TOKEN` (provided automatically)

**Outputs:**
- `image-tag`: Commit SHA (used by deploy jobs)

---

### 3. Deploy to Dev 🚀
**Trigger:** When code is pushed to `develop` branch (after build passes)

**Environment:** Kubernetes Dev Cluster

**Actions:**
1. Checkout code
2. Decode and configure kubectl with dev kubeconfig
3. Update image tags in K8s manifests to use built images
4. Create namespace and secrets
5. Apply all K8s manifests:
   - PostgreSQL database
   - Redis cache
   - Backend API (2 replicas with rolling update)
   - Frontend (2 replicas with rolling update)
   - Nginx proxy
6. Wait for rollout completion (5 minute timeout)
7. Verify all pods are running

**Required Secrets:**
- `KUBE_CONFIG_DATA_DEV`: Base64-encoded kubeconfig file

**Deployment Strategy:**
- Rolling Update: Gradually replaces old pods with new ones
- Zero downtime: At least 1 pod always running
- Auto-rollback if deployment fails

**Example Kubeconfig Setup:**
```bash
# Encode your kubeconfig
cat ~/.kube/config | base64 -w0

# Add to GitHub Secrets as KUBE_CONFIG_DATA_DEV
```

---

### 4. Deploy to Prod 🌐
**Trigger:** When code is pushed to `main` branch (after build passes)

**Environment:** Kubernetes Production Cluster

**Actions:**
- Same as dev deployment but uses production kubeconfig

**Required Secrets:**
- `KUBE_CONFIG_DATA_PROD`: Base64-encoded prod kubeconfig file

**Warning:** Only merge to `main` after thorough testing!

---

## Branch Strategy

```
main (Production)
  ↑ (pull request with code review)
  
develop (Staging/QA)
  ↑ (pull request with code review)
  
feature/xxx (Feature branches)
feature/yyy
bugfix/xxx
```

### Branch Behaviors

| Branch | Tests | Build | Deploy Dev | Deploy Prod |
|--------|-------|-------|-----------|------------|
| `feature/*` | ✅ | ❌ | ❌ | ❌ |
| `develop` | ✅ | ✅ | ✅ | ❌ |
| `main` | ✅ | ✅ | ❌ | ✅ |

---

## Running the Pipeline Manually

### Trigger a Deployment
```bash
# 1. Make changes
git add .
git commit -m "Your feature"

# 2. Push to develop (triggers dev deployment)
git push origin develop

# 3. Or push to main (triggers prod deployment)
git push origin main
```

### View Pipeline Status
1. Go to GitHub repo → **Actions** tab
2. Click on the latest workflow run
3. Watch each job in real-time

### Common Issues

#### ❌ Tests Failing
- Check test logs in GitHub Actions
- Run locally: `npm test` in backend folder
- Fix code and commit

#### ❌ Build Failing
- Check Docker build logs
- Verify Dockerfile is correct
- Ensure all dependencies are in package.json

#### ❌ Deploy Failing
- Verify `KUBE_CONFIG_DATA_DEV` secret exists
- Check kubeconfig is base64 encoded correctly
- Verify K8s cluster is accessible
- Check namespace and secrets exist

---

## GitHub Secrets Configuration

### Add Secrets to GitHub

1. Go to **Settings** → **Secrets and Variables** → **Actions**
2. Click **New repository secret**
3. Add each secret below:

### Required Secrets

#### KUBE_CONFIG_DATA_DEV
For dev environment deployment
```bash
# On your machine with kubectl access
cat ~/.kube/config | base64 -w0  # Linux/Mac
[System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($env:USERPROFILE + '\.kube\config'))  # Windows
```
Then paste the entire base64 string

#### KUBE_CONFIG_DATA_PROD
For production environment deployment
Same process but use your prod kubeconfig

### Optional Secrets

#### DOCKER_REGISTRY_USERNAME
If using private Docker registry (currently using GHCR)

#### DOCKER_REGISTRY_PASSWORD
If using private Docker registry

---

## Performance & Optimization

### Current Build Times
- Test stage: ~2 minutes
- Build images: ~3-5 minutes  
- Deploy to K8s: ~2-3 minutes
- **Total pipeline time: ~7-10 minutes**

### Optimization Tips
- Use Docker layer caching
- Run tests in parallel
- Use smaller base images
- Implement branch-specific workflows

---

## Security Best Practices

### ✅ Implemented
- Secrets never logged or exposed
- All secrets injected at runtime
- Kubeconfig only in encrypted GitHub secrets
- GHCR requires authentication
- Health checks prevent bad deployments
- Automated tests catch issues early

### 🔒 Additional Recommendations
- Rotate kubeconfig regularly
- Use RBAC in K8s for least privilege
- Scan images for vulnerabilities: `trivy image ghcr.io/.../image`
- Enable branch protection rules on `main`
- Require code reviews before merge
- Sign commits with GPG keys

---

## Monitoring Pipeline Health

### Check Last 10 Workflows
```bash
gh run list --limit 10
```

### Check Pipeline Status
```bash
gh run view <RUN_ID>
```

### Get Detailed Logs
```bash
gh run view <RUN_ID> --log
```

### Debugging Failed Jobs
1. View the failed job logs in GitHub Actions UI
2. Look for error messages and stack traces
3. Reproduce locally if possible
4. Fix and push again

---

## Rollback Procedure

### If Deployment Fails
The pipeline will NOT mark deployment as successful if pods don't start.

### Manual Rollback
```bash
# View deployment history
kubectl rollout history deployment/obito-store-backend-blue -n obito-store

# Rollback to previous version
kubectl rollout undo deployment/obito-store-backend-blue -n obito-store

# Or rollback to specific revision
kubectl rollout undo deployment/obito-store-backend-blue --to-revision=2 -n obito-store
```

---

## Workflow Diagram

```
┌─────────────────────────────┐
│ Push to develop or main     │
└──────────────┬──────────────┘
               │
        ┌──────▼────────┐
        │  Test Stage   │ (Run tests + linter)
        │  ✅ Unit tests│ (Fails if test fails)
        │  ✅ Lint      │
        └──────┬────────┘
               │
        ┌──────▼──────────────┐
        │ Build & Push Images │ (Build Docker images)
        │ ✅ Backend image    │ (Push to GHCR)
        │ ✅ Frontend image   │
        └──────┬──────────────┘
               │
       ┌───────┴────────┐
       │                │
  ┌────▼──────┐   ┌────▼─────────┐
  │ develop   │   │ main         │
  │ branch    │   │ branch       │
  └────┬──────┘   └────┬─────────┘
       │                │
  ┌────▼────────────┐   │
  │ Deploy to DEV   │   │
  │ K8s Cluster     │   │
  └─────────────────┘   │
                   ┌────▼──────────────┐
                   │ Deploy to PROD    │
                   │ K8s Cluster       │
                   └───────────────────┘
```

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-container-registry)
- [kubectl Documentation](https://kubernetes.io/docs/reference/kubectl/)
- [Docker Documentation](https://docs.docker.com/)
