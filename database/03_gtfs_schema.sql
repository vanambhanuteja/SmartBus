-- Versioned GTFS static schedule catalog. Existing SmartBus route/trip tables stay independent.
CREATE TABLE IF NOT EXISTS gtfs_feeds (
  feed_id BIGSERIAL PRIMARY KEY,
  source_url TEXT NOT NULL,
  feed_publisher_name TEXT,
  feed_publisher_url TEXT,
  feed_lang TEXT,
  feed_version TEXT,
  feed_contact_email TEXT,
  feed_contact_url TEXT,
  zip_sha256 CHAR(64) NOT NULL,
  feed_start_date DATE,
  feed_end_date DATE,
  license TEXT NOT NULL DEFAULT 'ODbL-1.0',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (zip_sha256)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gtfs_one_active_feed ON gtfs_feeds(is_active) WHERE is_active;

CREATE TABLE IF NOT EXISTS gtfs_agencies (
  feed_id BIGINT NOT NULL REFERENCES gtfs_feeds(feed_id) ON DELETE CASCADE,
  agency_id TEXT NOT NULL,
  agency_name TEXT NOT NULL,
  agency_url TEXT NOT NULL,
  agency_timezone TEXT NOT NULL,
  agency_lang TEXT,
  agency_phone TEXT,
  agency_fare_url TEXT,
  agency_email TEXT,
  PRIMARY KEY (feed_id, agency_id)
);
CREATE TABLE IF NOT EXISTS gtfs_services (
  feed_id BIGINT NOT NULL REFERENCES gtfs_feeds(feed_id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  monday BOOLEAN NOT NULL, tuesday BOOLEAN NOT NULL, wednesday BOOLEAN NOT NULL,
  thursday BOOLEAN NOT NULL, friday BOOLEAN NOT NULL, saturday BOOLEAN NOT NULL, sunday BOOLEAN NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL,
  PRIMARY KEY (feed_id, service_id), CHECK (end_date >= start_date)
);
CREATE TABLE IF NOT EXISTS gtfs_calendar_dates (
  feed_id BIGINT NOT NULL,
  service_id TEXT NOT NULL,
  service_date DATE NOT NULL,
  exception_type SMALLINT NOT NULL CHECK (exception_type IN (1,2)),
  PRIMARY KEY (feed_id, service_id, service_date),
  FOREIGN KEY (feed_id, service_id) REFERENCES gtfs_services(feed_id, service_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS gtfs_routes (
  feed_id BIGINT NOT NULL REFERENCES gtfs_feeds(feed_id) ON DELETE CASCADE,
  route_id TEXT NOT NULL,
  agency_id TEXT NOT NULL,
  route_short_name TEXT,
  route_long_name TEXT,
  route_desc TEXT,
  route_type INTEGER NOT NULL,
  route_url TEXT,
  route_color CHAR(6),
  route_text_color CHAR(6),
  route_sort_order INTEGER,
  continuous_pickup SMALLINT,
  continuous_drop_off SMALLINT,
  PRIMARY KEY (feed_id, route_id),
  FOREIGN KEY (feed_id, agency_id) REFERENCES gtfs_agencies(feed_id, agency_id)
);
CREATE TABLE IF NOT EXISTS gtfs_stops (
  feed_id BIGINT NOT NULL REFERENCES gtfs_feeds(feed_id) ON DELETE CASCADE,
  stop_id TEXT NOT NULL,
  stop_code TEXT,
  stop_name TEXT NOT NULL,
  stop_desc TEXT,
  stop_lat DOUBLE PRECISION,
  stop_lon DOUBLE PRECISION,
  zone_id TEXT,
  stop_url TEXT,
  location_type SMALLINT NOT NULL DEFAULT 0,
  parent_station TEXT,
  stop_timezone TEXT,
  wheelchair_boarding SMALLINT,
  level_id TEXT,
  platform_code TEXT,
  PRIMARY KEY (feed_id, stop_id),
  FOREIGN KEY (feed_id, parent_station) REFERENCES gtfs_stops(feed_id, stop_id) DEFERRABLE INITIALLY DEFERRED,
  CHECK (stop_lat IS NULL OR stop_lat BETWEEN -90 AND 90),
  CHECK (stop_lon IS NULL OR stop_lon BETWEEN -180 AND 180)
);
CREATE TABLE IF NOT EXISTS gtfs_shape_catalog (
  feed_id BIGINT NOT NULL REFERENCES gtfs_feeds(feed_id) ON DELETE CASCADE,
  shape_id TEXT NOT NULL,
  PRIMARY KEY (feed_id, shape_id)
);
CREATE TABLE IF NOT EXISTS gtfs_shapes (
  feed_id BIGINT NOT NULL REFERENCES gtfs_feeds(feed_id) ON DELETE CASCADE,
  shape_id TEXT NOT NULL,
  shape_pt_sequence INTEGER NOT NULL CHECK (shape_pt_sequence >= 0),
  shape_pt_lat DOUBLE PRECISION NOT NULL CHECK (shape_pt_lat BETWEEN -90 AND 90),
  shape_pt_lon DOUBLE PRECISION NOT NULL CHECK (shape_pt_lon BETWEEN -180 AND 180),
  shape_dist_traveled DOUBLE PRECISION,
  PRIMARY KEY (feed_id, shape_id, shape_pt_sequence),
  FOREIGN KEY (feed_id, shape_id) REFERENCES gtfs_shape_catalog(feed_id, shape_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS gtfs_trips (
  feed_id BIGINT NOT NULL,
  trip_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  trip_headsign TEXT,
  trip_short_name TEXT,
  direction_id SMALLINT,
  block_id TEXT,
  shape_id TEXT,
  wheelchair_accessible SMALLINT,
  bikes_allowed SMALLINT,
  PRIMARY KEY (feed_id, trip_id),
  UNIQUE (feed_id, route_id, trip_id),
  FOREIGN KEY (feed_id, route_id) REFERENCES gtfs_routes(feed_id, route_id),
  FOREIGN KEY (feed_id, service_id) REFERENCES gtfs_services(feed_id, service_id),
  FOREIGN KEY (feed_id, shape_id) REFERENCES gtfs_shape_catalog(feed_id, shape_id)
);
CREATE TABLE IF NOT EXISTS gtfs_stop_times (
  feed_id BIGINT NOT NULL,
  trip_id TEXT NOT NULL,
  arrival_seconds INTEGER,
  departure_seconds INTEGER,
  stop_id TEXT NOT NULL,
  stop_sequence INTEGER NOT NULL CHECK (stop_sequence > 0),
  stop_headsign TEXT,
  pickup_type SMALLINT,
  drop_off_type SMALLINT,
  shape_dist_traveled DOUBLE PRECISION,
  timepoint SMALLINT NOT NULL DEFAULT 1 CHECK (timepoint IN (0,1)),
  PRIMARY KEY (feed_id, trip_id, stop_sequence),
  FOREIGN KEY (feed_id, trip_id) REFERENCES gtfs_trips(feed_id, trip_id) ON DELETE CASCADE,
  FOREIGN KEY (feed_id, stop_id) REFERENCES gtfs_stops(feed_id, stop_id),
  CHECK (arrival_seconds IS NULL OR arrival_seconds >= 0),
  CHECK (departure_seconds IS NULL OR departure_seconds >= 0)
);
CREATE TABLE IF NOT EXISTS gtfs_fare_attributes (
  feed_id BIGINT NOT NULL,
  fare_id TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency_type CHAR(3) NOT NULL,
  payment_method SMALLINT NOT NULL,
  transfers SMALLINT,
  agency_id TEXT,
  transfer_duration INTEGER,
  PRIMARY KEY (feed_id, fare_id),
  FOREIGN KEY (feed_id, agency_id) REFERENCES gtfs_agencies(feed_id, agency_id)
);
CREATE TABLE IF NOT EXISTS gtfs_fare_rules (
  fare_rule_id BIGSERIAL PRIMARY KEY,
  feed_id BIGINT NOT NULL,
  fare_id TEXT NOT NULL,
  route_id TEXT,
  origin_id TEXT,
  destination_id TEXT,
  contains_id TEXT,
  FOREIGN KEY (feed_id, fare_id) REFERENCES gtfs_fare_attributes(feed_id, fare_id) ON DELETE CASCADE,
  FOREIGN KEY (feed_id, route_id) REFERENCES gtfs_routes(feed_id, route_id)
);
CREATE TABLE IF NOT EXISTS gtfs_translations (
  feed_id BIGINT NOT NULL REFERENCES gtfs_feeds(feed_id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  language TEXT NOT NULL,
  translation TEXT NOT NULL,
  PRIMARY KEY (feed_id, table_name, field_name, record_id, language)
);
CREATE TABLE IF NOT EXISTS gtfs_attributions (
  feed_id BIGINT NOT NULL REFERENCES gtfs_feeds(feed_id) ON DELETE CASCADE,
  attribution_id TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  is_producer BOOLEAN NOT NULL DEFAULT FALSE,
  is_operator BOOLEAN NOT NULL DEFAULT FALSE,
  is_authority BOOLEAN NOT NULL DEFAULT FALSE,
  attribution_url TEXT,
  PRIMARY KEY (feed_id, attribution_id)
);
CREATE TABLE IF NOT EXISTS gtfs_crowd_reports (
  report_id BIGSERIAL PRIMARY KEY,
  feed_id BIGINT NOT NULL,
  route_id TEXT NOT NULL,
  trip_id TEXT,
  stop_id TEXT NOT NULL,
  user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  occupancy_percent SMALLINT NOT NULL CHECK (occupancy_percent BETWEEN 0 AND 100),
  crowd_level VARCHAR(12) NOT NULL CHECK (crowd_level IN ('LOW','MODERATE','HIGH','OVERCROWDED')),
  reported_vehicle_label VARCHAR(80),
  vehicle_type VARCHAR(40),
  observed_at TIMESTAMPTZ NOT NULL,
  note VARCHAR(255),
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (feed_id, route_id) REFERENCES gtfs_routes(feed_id, route_id),
  FOREIGN KEY (feed_id, trip_id, route_id) REFERENCES gtfs_trips(feed_id, trip_id, route_id),
  FOREIGN KEY (feed_id, stop_id) REFERENCES gtfs_stops(feed_id, stop_id)
);
CREATE TABLE IF NOT EXISTS gtfs_predictions (
  prediction_id BIGSERIAL PRIMARY KEY,
  feed_id BIGINT NOT NULL,
  route_id TEXT NOT NULL,
  travel_time VARCHAR(8) NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  predicted_percent REAL NOT NULL CHECK (predicted_percent BETWEEN 0 AND 100),
  crowd_level VARCHAR(12) NOT NULL CHECK (crowd_level IN ('LOW','MODERATE','HIGH','OVERCROWDED')),
  reports_used INTEGER NOT NULL CHECK (reports_used > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (feed_id, route_id) REFERENCES gtfs_routes(feed_id, route_id)
);

CREATE TABLE IF NOT EXISTS gtfs_report_confirmations (
    report_id BIGINT NOT NULL REFERENCES gtfs_crowd_reports(report_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (report_id, user_id)
);
CREATE TABLE IF NOT EXISTS gtfs_report_flags (
    report_id BIGINT NOT NULL REFERENCES gtfs_crowd_reports(report_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY(report_id,user_id)
);
CREATE TABLE IF NOT EXISTS favorite_gtfs_routes (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    feed_id BIGINT NOT NULL,
    route_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, feed_id, route_id)
);
CREATE TABLE IF NOT EXISTS favorite_gtfs_stops (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    feed_id BIGINT NOT NULL,
    stop_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, feed_id, stop_id)
);

CREATE INDEX IF NOT EXISTS idx_gtfs_routes_name ON gtfs_routes(feed_id, route_short_name, route_long_name);
CREATE INDEX IF NOT EXISTS idx_gtfs_stops_name ON gtfs_stops(feed_id, stop_name);
CREATE INDEX IF NOT EXISTS idx_gtfs_stops_parent ON gtfs_stops(feed_id, parent_station);
CREATE INDEX IF NOT EXISTS idx_gtfs_trip_route_service ON gtfs_trips(feed_id, route_id, service_id, direction_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_trip_shape ON gtfs_trips(feed_id, shape_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_stop_times_stop_arrival ON gtfs_stop_times(feed_id, stop_id, arrival_seconds);
CREATE INDEX IF NOT EXISTS idx_gtfs_fare_rules_route_fare ON gtfs_fare_rules(feed_id, route_id, fare_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_fare_rules_zones ON gtfs_fare_rules(feed_id, origin_id, destination_id, fare_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_crowd_route_time ON gtfs_crowd_reports(feed_id, route_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gtfs_crowd_stop_time ON gtfs_crowd_reports(feed_id, stop_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gtfs_crowd_trip_time ON gtfs_crowd_reports(feed_id, trip_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gtfs_predictions_route_time ON gtfs_predictions(feed_id, route_id, created_at DESC);
