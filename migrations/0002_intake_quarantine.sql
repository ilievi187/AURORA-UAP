-- AURORA V1.5 / QUARANTINED TEXT-ONLY INTAKE.
-- Apply only after the V1.4 base migration; this migration creates no public case.
-- No email, name, IP address, precise address, media or R2 metadata columns.
CREATE TABLE IF NOT EXISTS intake_submissions (
 id TEXT PRIMARY KEY CHECK(length(id) BETWEEN 18 AND 90),
 request_key TEXT NOT NULL UNIQUE,
 country_code TEXT NOT NULL CHECK(length(country_code)=2 AND country_code=upper(country_code)),
 region TEXT NOT NULL CHECK(length(region) BETWEEN 2 AND 80),
 approximate_location TEXT NOT NULL CHECK(length(approximate_location) BETWEEN 2 AND 120),
 approximate_latitude REAL CHECK(approximate_latitude IS NULL OR approximate_latitude BETWEEN -90 AND 90),
 approximate_longitude REAL CHECK(approximate_longitude IS NULL OR approximate_longitude BETWEEN -180 AND 180),
 occurred_local TEXT NOT NULL, time_zone TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('lights','object','instrument','other')),
 description TEXT NOT NULL CHECK(length(description) BETWEEN 50 AND 5000),
 language_code TEXT NOT NULL DEFAULT 'en',
 consent_version TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','needs_clarification','approved','rejected')),
 publication_status TEXT NOT NULL DEFAULT 'quarantined' CHECK(publication_status='quarantined'),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_intake_status_created ON intake_submissions(status,created_at);
CREATE INDEX IF NOT EXISTS idx_intake_country_date ON intake_submissions(country_code,occurred_local);
CREATE TABLE IF NOT EXISTS intake_review_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 submission_id TEXT NOT NULL REFERENCES intake_submissions(id) ON DELETE CASCADE,
 actor_type TEXT NOT NULL CHECK(actor_type IN ('admin','system','agent')),
 actor_id TEXT NOT NULL,
 action TEXT NOT NULL,
 previous_status TEXT, new_status TEXT,
 rationale TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_intake_review_events ON intake_review_events(submission_id,created_at);
-- Deliberate firewall: NO trigger can auto-copy intake_submissions into public cases.
-- Explicit reviewed publication will require a separate human-authorized release.
