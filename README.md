# 🚌 SmartBus – Public Transport Crowd Monitoring and Prediction Platform

NIE Mysuru · CSE · Collaborative Development and DevOps (1BCS303) · 2026–27 · 5-member team project

Passengers can use the illustrative Mysuru demo routes or the imported BMTC GTFS route catalog, report crowd conditions, and request forecasts. Admins manage legacy demo routes/stops and see analytics.

> **Data honesty:** illustrative Mysuru routes and synthetic training remain separate from BMTC data. BMTC GTFS contains published schedules, not live arrivals or crowd measurements. BMTC forecasts use actual passenger reports for the selected BMTC route and show “not enough crowd data to predict” until that route has at least 5 real reports.

```
React (nginx) ──/api──▶ Spring Boot ──▶ PostgreSQL
                            └──REST──▶ Flask + scikit-learn (Random Forest)
```

## Quick start (Docker)
Prerequisites: Docker Desktop (Compose v2).
```bash
cp .env.example .env      # set DB_PASSWORD, JWT_SECRET (32+ chars), ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up --build
```
Open **http://localhost:3000** · register as passenger, or log in with the `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env` for the admin area. Check the stack: `./scripts/smoke_test.sh`.

## Run without Docker (development)
```bash
# 1 database: PostgreSQL 16 → create db/user, then apply database/01_schema.sql, 02_seed.sql, and 03_gtfs_schema.sql
# 2 ML service
cd prediction-service && pip install -r requirements.txt && python -m app.generate_dataset && python -m app.train && flask --app app.main run -p 8000
# 3 backend (Java 21, Maven)   export DB_PASSWORD=... JWT_SECRET=... ADMIN_EMAIL=... ADMIN_PASSWORD=...
cd backend && mvn spring-boot:run
# 4 frontend
cd frontend && npm install && npm run dev      # http://localhost:5173 (proxies /api to :8080)
```
## Tests
`cd prediction-service && pytest` · `cd frontend && npm test` · `cd backend && mvn verify` · `./scripts/smoke_test.sh` (stack running). Honest results and gaps: [docs/testing/testing.md](docs/testing/testing.md).

## Repository layout
`frontend/` React+Vite+Leaflet · `backend/` Spring Boot · `prediction-service/` Python ML · `database/` schema, seed, tools · `infrastructure/terraform/` Azure IaC · `.github/workflows/` CI/CD · `scripts/` smoke test & GitHub setup · `docs/` architecture, diagrams, UX, testing · `presentation/` slides.

## BMTC data
Import, API, attribution, update steps, and the separation between scheduled times and actual passenger observations are documented in [docs/bmtc-gtfs.md](docs/bmtc-gtfs.md). The adapted BMTC schedule database is ODbL 1.0; see the source [BMTC GTFS feed](https://github.com/Vonter/bmtc-gtfs) and [ODbL terms](https://opendatacommons.org/licenses/odbl/1-0/). The application source code remains MIT-licensed; these are separate licenses.

## Documentation index
[Project definition](docs/architecture/01-project-definition.md) · [Database](docs/architecture/02-database.md) · [API](docs/architecture/03-api.md) · [ML methodology](docs/architecture/04-ml-methodology.md) · [Diagrams](docs/diagrams/diagrams.md) · [UX design](docs/ux-design/ux-design.md) · [Figma spec](docs/ux-design/figma-spec.md) · [DevOps](docs/devops.md) · [Team & Gitflow](docs/team-and-gitflow.md) · [Testing](docs/testing/testing.md) · [Syllabus coverage](docs/syllabus-coverage.md) · [Status & limitations](docs/status-and-limitations.md)

## Future enhancements
Live bus GPS / arrival updates · verified vehicle identifiers · push notifications · Kannada UI · persistent cloud DB (Azure Database for PostgreSQL) · E2E tests.

License: MIT.
