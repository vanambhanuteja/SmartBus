-- Safe to apply to an existing database. These tables support favorites and report feedback.
CREATE TABLE IF NOT EXISTS favorite_routes (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  route_id BIGINT NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY(user_id,route_id)
);
CREATE TABLE IF NOT EXISTS favorite_stops (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  stop_id BIGINT NOT NULL REFERENCES bus_stops(stop_id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY(user_id,stop_id)
);
CREATE TABLE IF NOT EXISTS report_confirmations (
  report_id BIGINT NOT NULL REFERENCES crowd_reports(report_id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY(report_id,user_id)
);
ALTER TABLE crowd_reports ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS crowd_report_flags (
  report_id BIGINT NOT NULL REFERENCES crowd_reports(report_id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason VARCHAR(255), created_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY(report_id,user_id)
);
CREATE TABLE IF NOT EXISTS admin_audit_log (
  audit_id BIGSERIAL PRIMARY KEY, actor_email VARCHAR(150) NOT NULL, action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40) NOT NULL, entity_id VARCHAR(100), details TEXT, created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS gtfs_report_confirmations (
  report_id BIGINT NOT NULL REFERENCES gtfs_crowd_reports(report_id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY(report_id,user_id)
);
ALTER TABLE gtfs_crowd_reports ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS gtfs_report_flags (
  report_id BIGINT NOT NULL REFERENCES gtfs_crowd_reports(report_id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason VARCHAR(255), created_at TIMESTAMP NOT NULL DEFAULT now(), PRIMARY KEY(report_id,user_id)
);
CREATE TABLE IF NOT EXISTS favorite_gtfs_routes (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  feed_id BIGINT NOT NULL, route_id VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,feed_id,route_id)
);
CREATE TABLE IF NOT EXISTS favorite_gtfs_stops (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  feed_id BIGINT NOT NULL, stop_id VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,feed_id,stop_id)
);
