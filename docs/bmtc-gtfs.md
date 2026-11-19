# BMTC GTFS data and passenger reports

SmartBus incorporates the unofficial BMTC schedule feed published at [Vonter/bmtc-gtfs](https://github.com/Vonter/bmtc-gtfs). It is offered under the [Open Database License 1.0 (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). BMTC is identified as the transit operator/authority and Vonter as the feed producer in the source feed. The incorporated schedule database is subject to ODbL attribution and share-alike requirements. SmartBus retains the source URL, feed version and SHA-256 fingerprint in `gtfs_feeds`; changes are distributed as source and can be obtained in machine-readable form from the original feed URL.

The feed is unofficial and its publisher warns that some timetable values may be inaccurate or interpolated. GTFS times are scheduled service times, not live vehicle arrivals. An arrival observation submitted by a passenger is stored separately with the time the bus was actually seen, the submission time, the selected stop, crowd estimate, and optional passenger-entered vehicle label/type. Passenger-entered vehicle details are unverified. GTFS schedule records do not populate crowd observations or model training.

## Feed audit (version 20261109)

The supplied extract has 5,063 bus routes, 10,128 stops, 69,642 trips, 2,238,693 stop times, 8,983 shapes, 4,237,296 shape points, 159 fare attributes, and 4,076,274 fare rules. Route, trip, service, stop, shape, fare and zone references resolved in the audit. No `calendar_dates.txt` was supplied; the weekly service calendar is present. `frequencies.txt`, `transfers.txt`, and newer GTFS fare files were also absent. There are 983 routes without an explicit route-ID fare rule; this does not mean those routes are free because zone-based rules may apply. Stop-time values beyond 24:00 are valid GTFS service-day times, while `timepoint=0` values are approximate. The feed's own accuracy warning remains relevant.

## Repeat an import

Place a current GTFS ZIP or an extracted GTFS directory at a path available to the importer. With the SmartBus Compose stack running, run:

```sh
docker compose --profile tools run --rm \
  -v /path/to/gtfs:/input:ro gtfs-importer --source /input
```

The import is transactional and idempotent for the same feed content. It validates the relational references while loading and only marks a feed active after successful completion. Existing SmartBus tables are not rewritten. For an extracted directory, pass its mounted directory; for a ZIP, pass the mounted ZIP file path.

## APIs

- `GET /api/transit/routes`, `GET /api/transit/stops?routeId=…`
- `GET /api/transit/shapes?routeId=…&directionId=…`
- `GET /api/transit/schedules?routeId=…&serviceDate=YYYY-MM-DD&stopId=…`
- `GET /api/transit/fares?routeId=…`, `GET /api/transit/attribution`
- Authenticated `POST /api/transit/crowd-reports` records actual passenger observations.
- Authenticated `POST /api/transit/predictions` uses reports for that BMTC route only. It requires at least 5 real reports in the last 180 days; until then it responds that there is not enough crowd data to predict. Forecasts with this small minimum should be treated as early estimates.

Schedules and crowd observations remain separate. Legacy SmartBus route and prediction endpoints are unchanged.
