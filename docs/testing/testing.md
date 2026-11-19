# Testing documentation

> Rule followed: a test is reported as passed **only if it was actually executed**. Results below are from runs in the build sandbox (Ubuntu 24, 1 CPU) on 2026-11-19.

## Executed results
| Area | Tool | Command | Result |
|---|---|---|---|
| Prediction service | pytest | `cd prediction-service && pytest -q` | **26 passed** (dataset validation, reproducibility, model load/missing model, category thresholds, prediction output, invalid input ×11, HTTP API) |
| Prediction service over HTTP | gunicorn + curl | start `gunicorn app.main:app`, call `/health`, `/predict` (valid + invalid) | **Worked**: health UP; valid prediction returned; invalid route → 400 |
| Frontend | Vitest + Testing Library | `cd frontend && npm test` | **12 passed** (rendering, crowd badges ×4, route display, login/register validation, report form) |
| Frontend build | Vite | `npm run build` | **Succeeded** |
| Database | PostgreSQL 16 (apt) | load `01_schema.sql` + `02_seed.sql` | **Loaded without error**, expected row counts, CHECK constraint rejected invalid occupancy |
| YAML syntax | PyYAML | parse workflows + compose | **Valid YAML** (syntax only – not executed by GitHub/Docker) |

## NOT executed in the build sandbox (written, must be run by the team)
| Area | Why | How to run |
|---|---|---|
| Backend JUnit tests (`backend/src/test`: auth ×6, routes ×6, crowd reports ×5, predictions ×3 with mocked ML, CrowdLevel) | Maven Central is unreachable from the sandbox, so the Spring Boot project could not be compiled or tested | `cd backend && mvn -B verify` (Java 21) – CI job `backend` does this |
| Docker builds, `docker compose up`, `scripts/smoke_test.sh` (frontend→backend→PostgreSQL→ML) | Docker is not available in the sandbox | `docker compose up -d --build --wait && ./scripts/smoke_test.sh` – CI job `compose-smoke-test` does this |
| Postman collection | Needs the running stack | Import `SmartBus.postman_collection.json`, set `baseUrl`, `adminPassword`, run with Collection Runner |
| GitHub Actions, Terraform validate/plan/apply, Azure deployment | No GitHub/Azure access | See `docs/devops.md` |

**Expect to fix small compile/test issues on first run of the backend** – it has never been compiled. Paste any error into an issue/PR and fix on `feature/backend`.

## Test design
* **Frontend:** component rendering (home, badges), form validation (client-side rules + inline errors), route display (list/selection), crowd-report interface (required fields, submit payload, confirmation).
* **Backend (JUnit 5 + MockMvc + H2):** registration/login/JWT, role checks (401 vs 403), route CRUD permissions & validation, crowd report validation and listing, prediction API with mocked `PredictionClient` (success, bad input, ML down → 503), admin dashboard counts.
* **Python (pytest):** see table. **Integration:** `scripts/smoke_test.sh` covers frontend→backend, backend→DB, backend→ML and RBAC through the real containers.

## Known test gaps
No browser E2E tests; no load tests; no test of the ACI deployment; backend integration with a real PostgreSQL uses H2 (PostgreSQL mode) in unit tests – the Compose smoke test covers real PostgreSQL.
