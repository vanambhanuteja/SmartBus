# Project status & limitations (as of the scaffold build, 2026-11-19)

## Completed (and how it was verified)
* Prediction service: dataset generator, model training/evaluation, Flask API – **26 pytest tests pass; HTTP calls verified**.
* Database schema + seed – **loaded into PostgreSQL 16; constraints verified**.
* Frontend (all passenger + admin pages) – **12 Vitest tests pass; production build succeeds**.
* Documentation, diagrams, wireframes, Figma spec, Postman collection, team/Gitflow docs, presentation.

## Written but NOT verified here
* **Spring Boot backend + JUnit tests** (never compiled; Maven Central blocked in the sandbox).
* **Docker images / Compose stack / smoke test** (no Docker in the sandbox) – therefore the "frontend ↔ backend ↔ DB ↔ ML working together" criterion is **unproven until the team runs it**.
* GitHub Actions workflows (never run), Terraform (never validated or applied).

## Pending / needs people or accounts
GitHub repo + pushing branches + branch protection + issues (`scripts/setup_github.sh`); real KSRTC/OSM verification of routes and stops; real user research, usability tests and the actual Figma file; Docker Hub/ACR credentials; Azure subscription for ACI; real screenshots/results for the presentation.

## Known limitations
Synthetic data only (metrics describe a simulation); approximate illustrative coordinates; passenger reports give a level, not an exact count; no rate-limiting/abuse protection on reports; JWT kept in `localStorage` (acceptable for a student demo, not hardened); ACI database not persistent; no live GPS; English only.
