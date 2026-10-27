-- AURORA V1.4: reviewed public cases only. No personal submissions are accepted.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS sources (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 publisher TEXT NOT NULL,
 homepage_url TEXT NOT NULL,
 license TEXT NOT NULL,
 license_url TEXT NOT NULL,
 rights_note TEXT NOT NULL,
 rights_checked_at TEXT NOT NULL,
 approved_for_ingest INTEGER NOT NULL DEFAULT 0 CHECK(approved_for_ingest IN (0,1)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS cases (
 id TEXT PRIMARY KEY,
 record_kind TEXT NOT NULL CHECK(record_kind IN ('historical_import','user_report','demo')),
 title TEXT NOT NULL, title_bg TEXT, description TEXT NOT NULL, description_bg TEXT,
 date TEXT NOT NULL, date_precision TEXT NOT NULL CHECK(date_precision IN ('day','month','year','unknown')),
 country_code TEXT CHECK(country_code IS NULL OR (length(country_code)=2 AND country_code=upper(country_code))),
 region TEXT, location TEXT NOT NULL,
 latitude REAL CHECK(latitude BETWEEN -90 AND 90), longitude REAL CHECK(longitude BETWEEN -180 AND 180),
 location_precision TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('lights','object','instrument','other')),
 assessment_status TEXT NOT NULL DEFAULT 'undetermined' CHECK(assessment_status IN ('resolved','unresolved','undetermined','disputed')),
 assessment_authority TEXT,
 assessment_confidence TEXT NOT NULL DEFAULT 'not_stated' CHECK(assessment_confidence IN ('high','moderate','low','not_stated')),
 review_status TEXT NOT NULL CHECK(review_status IN ('pending','approved','rejected','needs_clarification')),
 publication_status TEXT NOT NULL DEFAULT 'draft' CHECK(publication_status IN ('draft','published','withdrawn')),
 source_name TEXT NOT NULL, source_url TEXT NOT NULL, license TEXT NOT NULL,
 media TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(media)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_cases_public_country_date ON cases(publication_status, review_status, country_code, date);
CREATE INDEX IF NOT EXISTS idx_cases_assessment ON cases(publication_status,review_status,assessment_status);
CREATE INDEX IF NOT EXISTS idx_cases_public_category ON cases(publication_status, review_status, category);
CREATE INDEX IF NOT EXISTS idx_cases_region ON cases(country_code,region);
CREATE TABLE IF NOT EXISTS case_sources (
 case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
 source_id TEXT NOT NULL REFERENCES sources(id),
 source_record_id TEXT NOT NULL,
 source_url TEXT NOT NULL,
 recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(source_id, source_record_id),
 UNIQUE(case_id,source_id)
);
CREATE TABLE IF NOT EXISTS moderation_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 case_id TEXT NOT NULL REFERENCES cases(id),
 actor_type TEXT NOT NULL CHECK(actor_type IN ('admin','system','agent')),
 actor_id TEXT NOT NULL,
 action TEXT NOT NULL,
 old_status TEXT, new_status TEXT,
 explanation TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS import_runs (
 id TEXT PRIMARY KEY,
 source_id TEXT NOT NULL REFERENCES sources(id),
 run_type TEXT NOT NULL CHECK(run_type IN ('weekly_import','manual_import','monthly_audit')),
 status TEXT NOT NULL CHECK(status IN ('started','success','failed')),
 inserted_count INTEGER NOT NULL DEFAULT 0, updated_count INTEGER NOT NULL DEFAULT 0,
 rejected_count INTEGER NOT NULL DEFAULT 0,
 started_at TEXT NOT NULL, completed_at TEXT, details TEXT
);
CREATE INDEX IF NOT EXISTS idx_runs_source_status ON import_runs(source_id,status,completed_at);
CREATE TABLE IF NOT EXISTS media_assets (
 id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id),
 object_key TEXT, source_url TEXT, media_type TEXT NOT NULL,
 rights_status TEXT NOT NULL CHECK(rights_status IN ('pending','verified','rejected')),
 is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0,1)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
