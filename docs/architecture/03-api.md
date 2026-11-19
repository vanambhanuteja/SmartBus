# REST API documentation

Base URL: `/api` (through nginx on port 3000, or `http://localhost:8080` directly). JSON in/out. Auth: `Authorization: Bearer <JWT>` from login/register. Error shape: `{"timestamp","status","error","details?"}`.

| Method & path | Access | Purpose | Success | Errors |
|---|---|---|---|---|
| POST `/auth/register` `{fullName,email,password≥8}` | public | Create PASSENGER, returns token | 201 | 400 validation, 409 duplicate email |
| POST `/auth/login` `{email,password}` | public | Returns `{token,fullName,email,role}` | 200 | 400, 401 |
| GET `/routes`, `/routes/{id}` | public | Routes with ordered stops | 200 | 404 |
| POST/PUT `/routes[/{id}]` `{routeCode,name,active,stopIds[]}` | ADMIN | Create / replace route | 201/200 | 400 (unknown/duplicate stops), 403, 409 (duplicate code) |
| DELETE `/routes/{id}` | ADMIN | Delete | 204 | 404, 409 (has trips/reports) |
| GET `/stops`, `/stops/{id}` | public | Stops | 200 | 404 |
| POST/PUT/DELETE `/stops` | ADMIN | Manage stops `{name,latitude,longitude}` | 201/200/204 | 400, 403, 404 |
| GET `/buses` ; POST/PUT/DELETE | GET public, rest ADMIN | Buses `{registration,capacity,active}` | | |
| POST `/crowd-reports` `{routeId,crowdLevel,tripId?,note?}` | logged in | Submit report (`LOW|MODERATE|HIGH|OVERCROWDED`) | 201 | 400, 401, 404 route |
| GET `/crowd-reports?routeId=` | logged in | Latest 50 reports | 200 | 401 |
| DELETE `/crowd-reports/{id}` | ADMIN | Remove report | 204 | 403, 404 |
| POST `/predictions` `{routeId,travelTime:"HH:MM",dayOfWeek?0-6}` | logged in | Calls ML service; stores & returns forecast | 200 | 400, 404, 503 ML down |
| GET `/predictions/{routeId}` | logged in | Last 10 stored predictions | 200 | 404 |
| GET `/admin/dashboard` | ADMIN | Totals, crowd distribution, report sources, hourly averages | 200 | 401, 403 |
| GET `/actuator/health` | public | Health check | 200 | |

### Prediction service (internal, port 8000)
* `POST /predict` `{route_id, travel_time:"HH:MM", day_of_week?, recent_reports_avg?}` → `{route_id, predicted_occupancy_percent, crowd_category, travel_time, day_of_week, historical_occupancy, prediction_timestamp, model, data_source}`; 400 on invalid input.
* `GET /health`, `GET /model-info` (evaluation metrics).

Postman: import `docs/testing/SmartBus.postman_collection.json`.
