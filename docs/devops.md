# DevOps implementation (Modules 1–3)

## Workflow
`feature/*` → Pull Request → CI (build + test + docker build + compose smoke test) → review → merge to `develop` → release PR to `main` → (optional) images pushed → (manual) Azure deploy.

## CI/CD – `.github/workflows/ci.yml`
1. **changes** – `dorny/paths-filter` detects which of frontend / backend / prediction-service changed.
2. **frontend** – `npm ci`, `npm test`, `npm run build`. 3. **backend** – `mvn -B verify` (compile + JUnit + jar). 4. **prediction-service** – `pytest`.
5. **docker-build** – builds the three images. 6. **compose-smoke-test** – `docker compose up --wait` + `scripts/smoke_test.sh`.
7. **publish-images** – on pushes to `main`/`develop` only; logs in to Docker Hub and/or ACR **only if secrets exist**, otherwise prints a skip notice. Tags: short SHA (+`latest` on Docker Hub).
8. **deploy-azure.yml** – separate, manual (`workflow_dispatch`), uses the GitHub Environment `azure` (add required reviewers) and runs `terraform init/validate/plan/apply`.

Secrets to add (Settings → Secrets and variables → Actions): `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`; for deploy: `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `ARM_SUBSCRIPTION_ID`, `ARM_TENANT_ID`, `ACR_NAME`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

**Status:** workflow files are written and YAML-valid; **they have not run** (no GitHub access here). Expect to adjust after the first run.

## Docker (Module 3)
Dockerfiles: `frontend/` (node build → nginx, `/api` proxied via `BACKEND_HOST`), `backend/` (Maven build → JRE, non-root), `prediction-service/` (trains the model at build time, gunicorn, non-root), `database/` (for cloud only). `docker-compose.yml`: 4 services, private network `smartbus-net`, `pgdata` volume, env from `.env`, health checks, `depends_on: service_healthy` ordering (db + ML → backend → frontend). Only port 3000 is published.

### Command cheat-sheet
```bash
cp .env.example .env            # edit secrets first
docker compose build            # build images
docker compose up -d            # run in background (add --build to rebuild)
docker compose ps               # status + health
docker compose logs -f backend  # logs (service name optional)
docker inspect smartbus-backend-1 --format '{{.State.Health.Status}}'   # inspect (name from `docker ps`)
docker compose exec db psql -U smartbus -d smartbus -c "select count(*) from routes;"
docker compose down             # stop (data kept)   |  docker compose down -v   # stop + delete DB volume
# Docker Hub
docker login
docker tag smartbus-backend <hub-user>/smartbus-backend:1.0 && docker push <hub-user>/smartbus-backend:1.0
# Azure Container Registry
az login && az acr login --name <acrName>
docker tag smartbus-backend <acrName>.azurecr.io/smartbus-backend:1.0 && docker push <acrName>.azurecr.io/smartbus-backend:1.0
```
(Compose image names are `<folder>-<service>` e.g. `smartbus-backend`; check with `docker images`.)

## Infrastructure as Code – `infrastructure/terraform`
`main.tf` declares: resource group → Azure Container Registry (Basic) → Azure Container Instances group (frontend, backend, prediction, db containers sharing localhost, public DNS label). Secrets come from `TF_VAR_*`/`secure_environment_variables`. `terraform.tfvars.example` shows non-secret inputs.
```bash
cd infrastructure/terraform
terraform init && terraform validate
export TF_VAR_db_password=... TF_VAR_jwt_secret=... TF_VAR_admin_password=... TF_VAR_admin_email=... TF_VAR_acr_name=smartbusnie12345
terraform plan          # review
terraform apply         # creates billable resources!   |   terraform destroy  # clean up
```
Order for a first ACI deployment: `terraform apply -target=azurerm_container_registry.acr` → push the four images (`smartbus-frontend`, `smartbus-backend`, `smartbus-prediction-service`, `smartbus-database`) → full `terraform apply`.
**Status:** configuration written; **not validated** (Terraform CLI unavailable in the sandbox) and **not deployed** (no Azure credentials/subscription). The ACI database has no persistent storage (demo-grade).

## Cloud deployment status
Implemented configuration: yes. Successful deployment: **no – not attempted**. Needs an Azure subscription (student credits are fine) and approval to spend.
