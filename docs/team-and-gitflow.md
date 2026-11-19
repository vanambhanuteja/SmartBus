# Team structure, Gitflow and GitHub collaboration (Module 2)

> **Do not fabricate contributions.** The repository contains one scaffold commit. Every member must make their own commits/PRs; `git log` should honestly show who did what. Names below are placeholders – fill in real names.

## Branches (Gitflow)
`main` (releases only) · `develop` (integration) · `feature/frontend` · `feature/backend` · `feature/ml` · `feature/database` · `feature/devops`. Short-lived extra branches: `feature/<topic>`, `release/x.y`, `hotfix/<bug>`. `scripts/setup_github.sh` pushes the branches, applies branch protection and opens the issues (needs `gh` CLI + a repo you own).

## Git commands to practise (syllabus list)
```bash
git clone <url> && cd smartbus                 # clone
git fetch origin                               # download without merging
git switch develop && git pull origin develop  # pull
git switch -c feature/frontend origin/feature/frontend   # or: git switch feature/frontend
git add frontend/src && git commit -m "feat(frontend): add route list"   # add + commit
git push -u origin feature/frontend            # push, then open a Pull Request on GitHub
git fetch origin && git rebase origin/develop  # rebase YOUR local feature branch (never shared history)
git switch develop && git merge --no-ff feature/frontend   # merge (normally done via PR)
```
Rebase only your own unpublished work; use merge for shared branches. Resolve conflicts, `git add`, `git rebase --continue`/commit.

## Rules
PRs target `develop`; ≥1 review from a different member; CI green; squash or merge-commit; link issue (`Closes #n`). Branch protection on `main` and `develop`: PR required, 1 approval, status checks (`frontend`, `backend`, `prediction-service`). Commit style: `feat|fix|docs|test|ci|chore(scope): message`.

## Five roles (everyone learns the whole app; everyone opens PRs and reviews)
| # | Role | Owns | Branch | Tests owned | Reviews |
|---|---|---|---|---|---|
| 1 | Frontend dev | React pages/components, Leaflet map, passenger dashboard, CSS | `feature/frontend` | Vitest | backend API contract |
| 2 | Backend dev | Spring Boot APIs, JWT/RBAC, route & report management | `feature/backend` | JUnit, Postman | DB schema |
| 3 | ML + DB dev | dataset, model, prediction API, PostgreSQL schema/seed | `feature/ml`, `feature/database` | pytest, SQL checks | backend↔ML contract |
| 4 | DevOps | Git/GitHub setup, Actions, Docker/Compose, Terraform, Azure | `feature/devops` | compose smoke test | all PR pipelines |
| 5 | UI/UX + integration | personas, Figma, usability tests, docs, end-to-end integration, presentation | `docs/*`, `feature/ux` | usability test, E2E demo script | frontend UX |

**Integration:** Member 5 runs the full stack weekly from `develop`; API changes need Member 2 + Member 1 sign-off; DB/ML contract changes need Members 3 + 2.

## Starter issues (`.github/ISSUES.md`, created by the setup script)
Frontend: #1 login/register UI (done in scaffold – review), #2 map polish (stop search), #3 accessibility audit. Backend: #4 compile & fix first `mvn verify`, #5 pagination for reports, #6 bus-trip admin endpoints. ML/DB: #7 replace synthetic data with real reports export, #8 verify stops from OSM/Overpass, #9 model retraining script. DevOps: #10 push branch protection, #11 first CI run fixes, #12 Docker Hub/ACR secrets, #13 Terraform validate + ACI demo. UX: #14 5 user interviews, #15 build Figma file, #16 usability test report. Docs: #17 verify seed data with KSRTC info, #18 presentation screenshots from real run.
