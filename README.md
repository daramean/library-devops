# 📚 OBITO STORE — Library Management System

A full-stack, production-grade Library Management System built for DevOps workflows.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Cache | Redis |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Deployment | Render / Railway / AWS |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15+

### Run with Docker (Recommended)

```bash
git clone https://github.com/youruser/library-devops.git
cd library-devops
cp .env.example .env
docker-compose up --build
```

Access:
- Frontend: http://localhost
- Backend API: http://localhost/api/v1
- Grafana: http://localhost:9090

### Run on Kubernetes

This repo now includes Kubernetes manifests for a local cluster under `k8s/`.

```bash
kubectl apply -k k8s
```

This creates the backend, frontend, PostgreSQL, Redis, and Nginx reverse proxy in the `obito-store` namespace.

### Run Locally (Development)

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Project Structure

```
library-devops/
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express API
├── database/          # SQL migrations & seeds
├── docker/            # Dockerfiles
├── nginx/             # Nginx config
├── monitoring/        # Prometheus + Grafana config
└── .github/workflows/ # CI/CD pipelines
```

## Git Workflow
Follow the branch and pull request conventions in `CONTRIBUTING.md` and `BRANCHING.md`.
- Develop new work on `feature/*` branches off `develop`.
- Open PRs into `develop` and require passing CI before merge.
- Merge `develop` into `main` only for production releases.
- Protect `main` and `develop` in GitHub and require status checks.

## Default Credentials (Dev)

This repository no longer publishes default login credentials. Create administrative users through your deployment workflow or database seeding process, and store those credentials securely outside version control.

## API Documentation

Visit `/api/docs` when the backend is running (Swagger UI).

## Environment Variables

See `.env.example` for all required variables.

## Documentation

The repository includes project documentation for workflows, deployment, and infrastructure:
- `CONTRIBUTING.md` — contribution, PR, and review workflow.
- `BRANCHING.md` — branch strategy and naming conventions.
- `k8s/README.md` — Kubernetes manifest and deployment guide.
- `terraform/README.md` — Terraform provisioning guide.
- `DEMO.md` — local and cluster demo instructions.
- API docs are available at `http://localhost/api/docs` when the backend is running.

## Demo

### Local demo with Docker Compose
1. Copy `.env.example` to `.env`.
2. Fill required values such as `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_PASSWORD`, and `GRAFANA_ADMIN_PASSWORD`.
3. Start the stack from the repository root:
   ```bash
docker compose up --build
```
4. Open the application in a browser:
   - `http://localhost` — frontend and proxy to backend
   - `http://localhost/api/docs` — Swagger API documentation
   - `http://localhost:3001` — Grafana dashboard
5. Use the registration endpoint to create a demo user at `/api/v1/auth/register`.

### Kubernetes demo
- Configure `kubectl` for your cluster.
- Apply the manifests:
  ```bash
kubectl apply -k k8s
```
- Update image references and secret values before production deployment.
- Production deployments on `main` use blue/green rollouts through GitHub Actions.

### Demo checklist
- Verify frontend login/register flows.
- Verify backend API through Swagger UI.
- Verify persistence in PostgreSQL and Redis connectivity.
- Verify monitoring via Grafana and Prometheus.

## Infrastructure as Code

This repository now includes a Terraform module under `terraform/` for provisioning AWS network and compute resources. Configure your provider credentials, then run:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Test Coverage

The backend includes Jest tests in `backend/tests/` and a GitHub Actions workflow that runs migrations and tests against PostgreSQL and Redis before building Docker images.
