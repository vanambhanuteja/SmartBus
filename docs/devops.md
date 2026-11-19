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
Dockerfiles: `frontend/` (node build → nginx, `/api` proxied via `BACKEND_HOST`), `backend/` (Maven build → JRE, non-root), `prediction-service/` (trains the model at build time, gunicorn, non-root), `database/` (for cloud only). `docker-compose.yml`: database, importer tool, prediction service, backend, and frontend on private network `smartbus-net`; `pgdata` volume; env from `.env`; health checks; and `depends_on: service_healthy`. Local mode publishes port 3000. The optional `docker-compose.public.yml` overlay removes that port and adds Caddy on ports 80/443.

## Public access from a home-hosted Kali computer

The public overlay is already included. Before using it, reserve a stable LAN IP for the Kali computer in the router, confirm the router has a public address (CGNAT prevents direct inbound access), point a DuckDNS hostname to the public address, and forward TCP 80 and 443 to the reserved LAN IP. Permit those ports in the host firewall if one is enabled. Do not forward PostgreSQL or the Docker API port.

Add `PUBLIC_DOMAIN=your-name.duckdns.org` to the existing `.env` without replacing its database/admin/JWT entries. Keep `.env` private. Caddy obtains and renews HTTPS certificates when the hostname resolves publicly and inbound HTTP/HTTPS can reach the machine. If the public IP changes, configure DuckDNS updates in the router or with a local DuckDNS updater; keep its token private.

Start public mode from the project directory:

```bash
sudo docker compose -f docker-compose.yml -f docker-compose.public.yml up --build -d
sudo docker compose -f docker-compose.yml -f docker-compose.public.yml ps
```

Share `https://your-name.duckdns.org`. Local-only mode remains `docker compose up --build -d` at `http://localhost:3000`. Public access depends on the ISP/router allowing inbound connections; a running local stack or public GitHub repository alone does not provide that access.

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
