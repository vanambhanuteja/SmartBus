# SmartBus – Project Definition

**Institution:** The National Institute of Engineering, Mysuru · **Dept:** CSE · **Course:** Collaborative Development and DevOps (1BCS303) · **Year:** 2026–27 · **Team:** 5 members

## 1. Abstract
SmartBus is a web platform that lets Mysuru bus passengers see routes and stops on a map, check the **estimated crowd level** (Low / Moderate / High / Overcrowded) for a chosen route and travel time, and **report the current crowd** on a bus. Administrators manage routes, stops, buses and reports and view crowd analytics. A Python service uses a Random Forest model to predict occupancy; a Spring Boot backend connects the React frontend, PostgreSQL database and the ML service. The project is built with Git/GitHub (Gitflow), Docker Compose, GitHub Actions and Terraform to demonstrate the CDD syllabus. The demo network and occupancy data are **illustrative / simulated** (see Limitations).

## 2. Problem statement
Passengers cannot tell how crowded a bus will be before boarding, leading to uncomfortable journeys, overcrowding and poor travel planning. Existing services give little information on occupancy across routes and timings. A central web platform is needed that shows routes, estimates crowd levels, collects passenger reports and gives administrators demand insights.

## 3. Objectives
1. User-friendly passenger web app. 2. Show bus routes and stops. 3. Show predicted crowd level per route/time. 4. Let passengers submit crowd reports. 5. Simple ML occupancy model. 6. Admin analytics and management. 7. Collaborative development with Git/GitHub. 8. Containerise with Docker/Compose. 9. CI/CD with GitHub Actions. 10. Infrastructure as Code + cloud container deployment (Terraform, ACR, ACI). 11. Apply UX design and Figma prototypes.

## 4. Existing system
Passengers rely on word of mouth, visual guesswork at the stop, and generic timetables. Information about occupancy is not published; there is no way to compare timings, and operators have no easy aggregated view of reported crowding. *(General observation about typical city-bus information; not a survey of KSRTC internal systems.)*

## 5. Proposed system
A three-tier web application plus an ML microservice: passengers register/log in, pick a route + time, get a forecast combining history and recent passenger reports, and can report crowding. Admins see totals, distribution charts and hourly analytics and manage data. Real reports are stored with `source = PASSENGER`, so they can progressively replace simulated records.

## 6. Functional requirements
| ID | Requirement |
|----|-------------|
| FR1 | Passenger registration and login (JWT) |
| FR2 | View routes, stops and an interactive Leaflet/OSM map |
| FR3 | Select route + travel time (+ day) and view predicted occupancy % and category |
| FR4 | Submit a crowd report (route + level + optional note) |
| FR5 | View previous crowd reports for a route |
| FR6 | Admin login; dashboard totals (routes, buses, stops, reports) |
| FR7 | Admin crowd-distribution chart and hourly historical analytics |
| FR8 | Admin CRUD for routes and stops; buses via API; delete reports |
| FR9 | Role-based authorisation: only ADMIN can modify transport data |
| FR10 | Prediction service returns occupancy %, category, route and timestamp |

## 7. Non-functional requirements
Usability (WCAG-minded: labels, text + symbols not colour alone, keyboard focus, 44 px targets), responsiveness (mobile-first CSS), security (BCrypt, JWT, validation, no secrets in git), reliability (health checks, clear error messages, 503 if ML is down), maintainability (small modules, tests, CI), portability (Docker), reproducibility (seeded dataset/training), performance (single prediction well under 1 s locally).

## 8. Technology versions
Java 21 · Spring Boot 3.3.5 · PostgreSQL 16 · Python 3.12 · Flask 3.1 · scikit-learn ≥1.5 (1.9.1 in test sandbox) · pandas/NumPy · React 18.3 · Vite 5 · Leaflet 1.9.4 · Node 20 (22 in sandbox) · Docker Compose v2 · Terraform ≥1.6 (azurerm ~>3.100).
