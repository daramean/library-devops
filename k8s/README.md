# Kubernetes Deployment

This repository includes Kubernetes manifests for local or managed clusters.

## Apply manifests

```bash
kubectl apply -k k8s
```

## What is included

- `obito-store` namespace
- PostgreSQL deployment and service
- Redis deployment and service
- Backend deployment and service
- Frontend deployment and service
- Nginx reverse proxy deployment and load balancer service
- Kubernetes secret for application credentials

## Notes

- The backend and frontend deployments use placeholder image names:
  - `ghcr.io/yourorg/library-devops-backend:latest`
  - `ghcr.io/yourorg/library-devops-frontend:latest`

- The default blue deployments are active by default, and production can use blue/green switchovers.
- Replace these image names with your own image registry before deploying.
- The Kubernetes manifests are intended for development and proof-of-concept usage.
- For production, add persistent volumes and a cluster-managed ingress controller.
