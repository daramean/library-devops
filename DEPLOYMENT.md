# Deployment Strategy & Documentation

## Overview
This project implements a complete DevOps infrastructure with CI/CD pipelines, containerization, Kubernetes orchestration, and monitoring. The deployment strategy uses **Rolling Updates** for zero-downtime deployments.

---

## Deployment Strategy: Rolling Update

### What is Rolling Update?
A rolling update gradually replaces old instances of the application with new ones, ensuring service availability throughout the deployment process.

### Configuration
Located in [k8s/backend.yaml](k8s/backend.yaml#L7-L11):

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1        # Max 1 pod can be unavailable during update
    maxSurge: 1              # Max 1 extra pod can be created during update
```

### How It Works
1. Creates 1 new pod with the new image
2. Kills 1 old pod when the new pod is ready
3. Repeats until all pods are updated
4. Ensures at least 1 pod is always running (with 2 replicas configured)

### Benefits
- ✅ **Zero Downtime**: Service remains available during deployment
- ✅ **Automatic Rollback**: If new version fails, keep old pods running
- ✅ **Gradual Rollout**: Can catch issues early with partial deployment
- ✅ **Health Checks**: Kubernetes verifies pod health before proceeding

---

## CI/CD Pipeline

### Pipeline Stages

#### 1. **Test Stage** (Runs on every commit)
- Runs backend unit tests
- Runs linter checks
- Fails if tests don't pass
- Prevents broken code from being deployed

**Tests Included:**
- `auth.controller.test.js` - Authentication tests
- `auth.middleware.test.js` - Auth middleware tests
- `book.controller.test.js` - Book CRUD tests
- `borrow.controller.test.js` - Borrow operation tests
- `health.test.js` - Health check tests

#### 2. **Build & Push Stage**
- Builds Docker images for backend and frontend
- Pushes images to GitHub Container Registry (GHCR)
- Tags with commit SHA and "latest"

**Images Published:**
- `ghcr.io/{owner}/library-devops-backend:{SHA}`
- `ghcr.io/{owner}/library-devops-frontend:{SHA}`

#### 3. **Deploy to Dev** (When pushing to `develop` branch)
- Deploys to Kubernetes dev environment
- Uses rolling update strategy
- Waits for pods to be ready before considering deployment successful

#### 4. **Deploy to Prod** (When pushing to `main` branch)
- Same as dev deployment but to production environment
- Requires production K8s credentials
- Same rolling update strategy

---

## Local Development Setup

### Prerequisites
```powershell
# Install Docker & Docker Compose
# https://www.docker.com/products/docker-desktop

# Install Node.js 18+
# https://nodejs.org/
```

### Running Services Locally

```powershell
# 1. Create .env file
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Check services
docker-compose ps

# 4. View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Access Services
| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3003 | Web application |
| Backend API | http://localhost:5001 | REST API |
| Nginx Proxy | http://localhost:8080 | Load balancer |
| Prometheus | http://localhost:9090 | Metrics |
| Grafana | http://localhost:3001 | Dashboard (admin/password) |

---

## Kubernetes Deployment

### Prerequisites
```powershell
# Install kubectl
# https://kubernetes.io/docs/tasks/tools/

# Get kubeconfig from your K8s cluster
# Export as KUBE_CONFIG_DATA_DEV and KUBE_CONFIG_DATA_PROD secrets in GitHub
```

### Manual Deployment

```bash
# Deploy to cluster
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/nginx.yaml

# Check deployment status
kubectl get pods -n obito-store
kubectl get services -n obito-store
kubectl get deployments -n obito-store

# Watch rollout progress
kubectl rollout status deployment/obito-store-backend-blue -n obito-store

# View logs
kubectl logs -f deployment/obito-store-backend-blue -n obito-store

# Scale deployment
kubectl scale deployment obito-store-backend-blue --replicas=3 -n obito-store
```

### K8s Manifests Structure

```
k8s/
├── namespace.yaml          # Create obito-store namespace
├── secret.yaml             # Environment variables & secrets
├── postgres.yaml           # Database deployment
├── redis.yaml              # Cache deployment
├── backend.yaml            # Backend API (2 replicas, rolling update)
├── frontend.yaml           # Frontend React app
├── nginx.yaml              # Nginx ingress/proxy
└── kustomization.yaml      # Kustomize config
```

---

## Infrastructure as Code (Terraform)

### Resources Provisioned
- AWS VPC with subnets
- Security groups with firewall rules
- EC2 instances for K8s cluster nodes
- Load balancer for traffic distribution
- S3 buckets for data

### Deployment

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Variables
Update `terraform/terraform.tfvars`:
```hcl
aws_region = "us-east-1"
aws_availability_zone = "us-east-1a"
instance_count = 3
instance_type = "t3.medium"
```

---

## Monitoring & Logging

### Prometheus
- Scrapes metrics from backend (port 9090)
- Stores time-series data
- Queries available at `http://localhost:9090`

### Grafana
- Dashboard for visualization
- Pre-configured data source: Prometheus
- Access: `http://localhost:3001`
- Default: admin / (set in GRAFANA_ADMIN_PASSWORD)

### Application Metrics Tracked
- Request count by endpoint
- Response time / latency
- Error rate
- Active connections
- Database query performance
- Memory usage
- CPU usage

### Logs
- Backend logs: Winston logger → `backend/logs/combined.log`
- Docker logs: `docker-compose logs`
- K8s logs: `kubectl logs`

---

## GitHub Secrets Setup

For CD/CD to work, configure these GitHub Secrets:

| Secret | Value |
|--------|-------|
| `KUBE_CONFIG_DATA_DEV` | Base64-encoded kubeconfig for dev K8s (for dev deployments) |
| `KUBE_CONFIG_DATA_PROD` | Base64-encoded kubeconfig for prod K8s (for production deployments) |

### How to Add Secrets
1. Go to GitHub repo → Settings → Secrets and Variables → Actions
2. Click "New repository secret"
3. Name: `KUBE_CONFIG_DATA_DEV`
4. Value: `cat ~/.kube/config | base64 -w0` (Linux/Mac) or use PowerShell encoding

---

## Rollback Procedure

### Automatic Rollback (If deployment fails)
```bash
# Kubernetes automatically keeps previous replica set
# Just scale down new version and scale up old one
kubectl rollout undo deployment/obito-store-backend-blue -n obito-store
```

### Manual Rollback to Specific Version
```bash
# View rollout history
kubectl rollout history deployment/obito-store-backend-blue -n obito-store

# Rollback to previous version
kubectl rollout undo deployment/obito-store-backend-blue --to-revision=3 -n obito-store
```

---

## Troubleshooting

### Pods not starting?
```bash
kubectl describe pod <pod-name> -n obito-store
kubectl logs <pod-name> -n obito-store
```

### Image pull errors?
```bash
# Check image exists
docker pull ghcr.io/yourorg/library-devops-backend:latest

# Verify K8s secret for registry access
kubectl get secrets -n obito-store
```

### Database connection issues?
```bash
# Test database connectivity from pod
kubectl exec -it <backend-pod-name> -n obito-store -- psql -h postgres -U postgres -d library_db
```

---

## Team Roles & Responsibilities

| Role | Responsibilities |
|------|------------------|
| **DevOps Engineer** | CI/CD pipeline, infrastructure, K8s, monitoring |
| **Backend Developer** | API development, database schema, authentication |
| **Frontend Developer** | UI/UX, React components, API integration |
| **QA Engineer** | Test strategy, test automation, deployment verification |

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Merged to `main` branch
- [ ] Secrets configured in GitHub
- [ ] K8s cluster is healthy
- [ ] Database migrations applied
- [ ] Monitoring & alerts configured
- [ ] Rollback plan documented
- [ ] Load testing completed
- [ ] Stakeholders notified

---

## References

- [Kubernetes Rolling Updates](https://kubernetes.io/docs/tasks/run-application/rolling-update-replication-controller/)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [GitHub Actions Workflows](https://docs.github.com/en/actions/using-workflows)
- [Terraform Documentation](https://www.terraform.io/docs)
- [Prometheus Metrics](https://prometheus.io/docs/concepts/data_model/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
