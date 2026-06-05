# Branching Strategy

This repository uses a Git workflow that separates feature development, staging integration, and production releases.

## Branches
- `main` — production branch. Only deployable, reviewed code is merged here.
- `develop` — integration branch for completed work and staging deployments.
- `feature/<ticket>-short-description` — feature branches created from `develop`.
- `fix/<ticket>-short-description` — bugfix branches created from `develop`.
- `chore/<area>-short-description` — repository maintenance and documentation branches.
- `release/<version>` — optional branch from `develop` for release preparation.
- `hotfix/<ticket>-short-description` — emergency fixes branched from `main` and merged back into both `main` and `develop`.

## Workflow
1. Sync `develop` locally and create a new branch from it.
2. Implement the change with small, self-contained commits.
3. Push the branch and open a PR into `develop`.
4. Include a summary, related issue, and testing notes in the PR.
5. Request at least one reviewer and wait for CI status checks to pass.
6. Merge into `develop` once approved.
7. When staging is ready, open a release PR from `develop` into `main`.
8. For urgent production fixes, branch from `main` using `hotfix/*`, then merge back into `main` and `develop`.

## Naming conventions
- Use lowercase and hyphens.
- Prefer branch names tied to a ticket or issue.
- Examples:
  - `feature/auth-refresh-token`
  - `fix/api-rate-limit`
  - `chore/update-docs`
  - `hotfix/payment-retry`

## Commit messages
- Use imperative tense: `feat(auth): add JWT refresh token endpoint`.
- Keep summaries under 72 characters and add details in the body if needed.
- Reference issues or tickets in the body when helpful.

## Merge strategy
- Merge `feature/*` into `develop` via PR.
- Use Squash merge for feature branches when you want a clean history.
- Use Merge commits for release or hotfix branches if preserving history is important.
- Avoid direct pushes to `main` or `develop`.

## Branch protection recommendations
- Require pull request reviews for `main` and `develop`.
- Require passing CI checks before merging.
- Enforce linear history or signed commits if desired.
- Restrict direct pushes to protected branches.
