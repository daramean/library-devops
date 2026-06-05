# Contributing

This project follows a collaborative Git workflow with protected branches, pull request reviews, and CI verification.

## Branching
- `main` — production-ready branch. Protected; merge only from `develop` via reviewed PRs.
- `develop` — integration branch for completed features and staging deployments.
- `feature/<ticket>-short-description` — feature branches off `develop`.
- `fix/<ticket>-short-description` — bugfix branches.
- `chore/<area>-short-description` — maintenance, cleanup, or documentation work.
- `release/<version>` — optional release preparation branch from `develop`.
- `hotfix/<ticket>-short-description` — emergency fixes branched from `main` and merged back into both `main` and `develop`.

## Issue and branch naming
- Prefer branch names that include the ticket or issue reference.
- Keep names lowercase and hyphenated.
- Examples:
  - `feature/auth-refresh-token`
  - `fix/login-token-expiration`
  - `chore/update-git-workflow`

## Commits
- Use imperative commit messages: `feat(auth): add JWT refresh token endpoint`.
- Keep commits focused and testable.
- Include tests or docs updates for new functionality.
- Avoid committing local secrets, generated files, or environment configuration.

## Pull Requests
- Open PRs from `feature/*` into `develop`.
- Include a concise summary, related issue, and testing notes.
- Request at least one reviewer and wait for approval before merging.
- Ensure CI passes and the diff contains no secrets.
- Merge with a strategy consistent with the repo: Squash/Merge is preferred for feature work.

## CI/CD
- PRs against `develop` and `main` run tests, linting, and build checks.
- `develop` deploys to dev/staging.
- `main` deploys to production with blue/green deployment support.

## Code quality
- Run linting and tests in the affected workspace before creating a PR.
- Add or update Jest tests for bug fixes and new features.
- Keep changes easy to review.

## Branch protection
- Protect `main` and `develop`.
- Require PR review and successful CI checks before merge.
- Restrict direct pushes to `main` and `develop` for non-admins.

## Recommended Git commands
```bash
git checkout develop
git pull origin develop
git checkout -b feature/<ticket>-short-description
git add .
git commit -m "feat(...): ..."
git push -u origin feature/<ticket>-short-description
```
