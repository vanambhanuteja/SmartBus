# CDD syllabus coverage (honest status)

Legend: ✅ done and verified here · 🟡 implemented/written but not executed here · ⬜ needs the team or external access.
The syllabus PDF was not provided; coverage follows the five module titles in the project brief.

| Module | Topic | Where | Status |
|---|---|---|---|
| 1 DevOps culture & infrastructure | DevOps workflow, CI, CD | `.github/workflows/ci.yml`, `docs/devops.md` | 🟡 written, YAML-valid, not run on GitHub |
| | Infrastructure as Code, Terraform | `infrastructure/terraform/*` | 🟡 written, not validated/applied |
| | Manual/controlled deploy stage | `deploy-azure.yml` | 🟡 |
| 2 Source code with Git | Gitflow branches (7) | local repo; `scripts/setup_github.sh` | ✅ created locally; ⬜ push to GitHub |
| | clone/add/commit/push/pull/fetch/merge/rebase | `docs/team-and-gitflow.md` | ✅ documented; ⬜ team to practise |
| | Pull requests, branch protection, issues | PR template, `.github/ISSUES.md`, setup script | 🟡 ⬜ needs GitHub repo |
| | README, CONTRIBUTING, 5-member structure | `README.md`, `CONTRIBUTING.md`, `docs/team-and-gitflow.md` | ✅ |
| 3 Containerization | Dockerfiles ×3 (+db image) | `*/Dockerfile` | 🟡 not built here (no Docker) |
| | Compose: networks, volumes, env, health checks, depends_on | `docker-compose.yml` | 🟡 |
| | Build/run/inspect/logs/stop, Docker Hub, ACR | `docs/devops.md` | ✅ documented; 🟡 publish job |
| | ACI deployment | Terraform | 🟡 config only; ⬜ no deployment |
| 4 Intro to UX | Design thinking stages, personas, journey, problem, wireframes, UI requirements | `docs/ux-design/ux-design.md`, `wireframes/` | ✅ artefacts written; ⬜ real user research pending |
| 5 Factors influencing UX | 7 UX factors, 5 usability characteristics, interaction design + 5 dimensions, user flows | same file | ✅ |
| | Figma frames/components/styles/prototype | `figma-spec.md` | ⬜ spec only – no Figma file created (no access) |
