-- SmartBus schema (PostgreSQL 16). Runs automatically on first start of the db container.
CREATE TABLE users (
    user_id        BIGSERIAL PRIMARY KEY,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,           -- BCrypt hash, never plain text
    role           VARCHAR(10)  NOT NULL DEFAULT 'PASSENGER' CHECK (role IN ('PASSENGER', 'ADMIN')),
    created_at     TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE routes (
    route_id    BIGSERIAL PRIMARY KEY,
    route_code  VARCHAR(10)  NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE bus_stops (
    stop_id    BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100)     NOT NULL,
    latitude   DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
    longitude  DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180)
);

-- Many-to-many: a route has many stops, a stop belongs to many routes (ordered by stop_sequence)
CREATE TABLE route_stops (
    route_id       BIGINT   NOT NULL REFERENCES routes(route_id)    ON DELETE CASCADE,
    stop_id        BIGINT   NOT NULL REFERENCES bus_stops(stop_id)  ON DELETE CASCADE,
    stop_sequence  SMALLINT NOT NULL CHECK (stop_sequence > 0),
    PRIMARY KEY (route_id, stop_id),
    UNIQUE (route_id, stop_sequence)
);

-- Several buses can serve the same route (routes 1 --- * buses is expressed through trips)
CREATE TABLE buses (
    bus_id         BIGSERIAL PRIMARY KEY,
    registration   VARCHAR(20) NOT NULL UNIQUE,
    capacity       SMALLINT    NOT NULL CHECK (capacity > 0),
    active         BOOLEAN     NOT NULL DEFAULT TRUE
);

-- A trip = one bus running one route at one time
CREATE TABLE trips (
    trip_id         BIGSERIAL PRIMARY KEY,
    route_id        BIGINT    NOT NULL REFERENCES routes(route_id),
    bus_id          BIGINT    NOT NULL REFERENCES buses(bus_id),
    departure_time  TIMESTAMP NOT NULL,
    UNIQUE (bus_id, departure_time)
);

CREATE TABLE crowd_reports (
    report_id          BIGSERIAL PRIMARY KEY,
    trip_id            BIGINT      REFERENCES trips(trip_id) ON DELETE SET NULL,
    route_id           BIGINT      NOT NULL REFERENCES routes(route_id),
    user_id            BIGINT      REFERENCES users(user_id) ON DELETE SET NULL,
    occupancy_percent  SMALLINT    NOT NULL CHECK (occupancy_percent BETWEEN 0 AND 100),
    crowd_level        VARCHAR(12) NOT NULL CHECK (crowd_level IN ('LOW','MODERATE','HIGH','OVERCROWDED')),
    source             VARCHAR(12) NOT NULL DEFAULT 'PASSENGER' CHECK (source IN ('PASSENGER','SYNTHETIC')),
    note               VARCHAR(255),
    reported_at        TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE TABLE predictions (
    prediction_id       BIGSERIAL PRIMARY KEY,
    route_id            BIGINT      NOT NULL REFERENCES routes(route_id),
    travel_time         VARCHAR(5)  NOT NULL,
    day_of_week         SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    predicted_percent   REAL        NOT NULL CHECK (predicted_percent BETWEEN 0 AND 100),
    crowd_level         VARCHAR(12) NOT NULL,
    created_at          TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE TABLE favorite_routes (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    route_id BIGINT NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, route_id)
);
CREATE TABLE favorite_stops (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    stop_id BIGINT NOT NULL REFERENCES bus_stops(stop_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, stop_id)
);
CREATE TABLE report_confirmations (
    report_id BIGINT NOT NULL REFERENCES crowd_reports(report_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (report_id, user_id)
);
ALTER TABLE crowd_reports ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE crowd_report_flags (
    report_id BIGINT NOT NULL REFERENCES crowd_reports(report_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason VARCHAR(255), created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY(report_id,user_id)
);
CREATE TABLE admin_audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    actor_email VARCHAR(150) NOT NULL,
    action VARCHAR(40) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_route_time ON crowd_reports (route_id, reported_at DESC);
CREATE INDEX idx_reports_trip       ON crowd_reports (trip_id);
CREATE INDEX idx_trips_route        ON trips (route_id);
CREATE INDEX idx_predictions_route  ON predictions (route_id, created_at DESC);
