# Security & Secrets

This project requires secure handling of credentials and deployment secrets.

Required GitHub repository secrets (examples):
- `GHCR_PAT` — personal access token with `write:packages` to push to GitHub Container Registry (alternative: configure `GITHUB_TOKEN` with package permissions).
- `KUBE_CONFIG_DATA_DEV` — base64-encoded kubeconfig for the dev cluster.
- `KUBE_CONFIG_DATA_PROD` — base64-encoded kubeconfig for the prod cluster.

How to add kubeconfig as a secret (example):

1. On your machine run: `cat ~/.kube/config | base64 -w 0` (use appropriate path on Windows: `type %USERPROFILE%\.kube\config | base64`).
2. Copy the base64 string and add it as the secret `KUBE_CONFIG_DATA_DEV` in the GitHub repo Settings → Secrets.

Notes
- Remove any committed `.env` or secret files from history and ensure `.env` is in `.gitignore`.
- For production, consider using a secrets manager (AWS Secrets Manager, Vault) and reference secrets via environment variables in the k8s manifests.
