# Contributing to SmartBus

1. **Pick an issue** (or open one) and comment that you're working on it.
2. **Branch** from `develop`: `git switch develop && git pull && git switch -c feature/<short-topic>` (the five long-lived area branches – `feature/frontend|backend|ml|database|devops` – are for the area owners; small fixes can use short-lived branches).
3. **Commit small and often**, message format `type(scope): summary` (`feat`, `fix`, `docs`, `test`, `ci`, `chore`). Commit only your own work.
4. **Run the tests** for the part you touched (`pytest`, `npm test`, `mvn verify`) and `docker compose up --build` before opening a PR if you changed service wiring.
5. **Open a Pull Request into `develop`** using the template; link the issue (`Closes #n`).
6. **Review:** at least one teammate approves; CI must be green; resolve all comments. Never approve your own PR.
7. **Merge** into `develop` (merge commit or squash). `main` only receives release PRs from `develop`, merged by the DevOps owner after the team demo.

## Rules
* Never commit secrets (`.env`, passwords, tokens, tfvars, tfstate). Use `.env.example` for new variables.
* Don't present synthetic data as real; keep the `source`/`data_source` labels.
* Keep changes simple and documented; update docs and tests with code.
* Rebase only your own unpushed branch; never force-push shared branches.
* Be respectful in reviews; critique code, not people.
