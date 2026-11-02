-- AURORA newsroom: private editorial articles and quarantined public tips.
-- Tips have no contact/IP/media columns and can never be copied into articles automatically.
CREATE TABLE IF NOT EXISTS news_tips (
  id TEXT PRIMARY KEY CHECK(length(id) BETWEEN 18 AND 90),
  source_url TEXT NOT NULL CHECK(length(source_url) BETWEEN 12 AND 1200),
  source_key TEXT NOT NULL UNIQUE CHECK(length(source_key) BETWEEN 12 AND 1200),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  reviewed_at TEXT,
  reviewed_by TEXT,
  rationale TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_tips_status_date ON news_tips(status,submitted_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS news_tip_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tip_id TEXT NOT NULL REFERENCES news_tips(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('received','approved','rejected')),
  rationale TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_news_tip_events_tip ON news_tip_events(tip_id,created_at);

CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY CHECK(length(id) BETWEEN 18 AND 90),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','unpublished')),
  language_code TEXT NOT NULL CHECK(length(language_code) BETWEEN 2 AND 5),
  category TEXT NOT NULL CHECK(category IN ('sightings','official','research','history','policy','other')),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 200),
  summary TEXT NOT NULL CHECK(length(summary) BETWEEN 30 AND 700),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 120 AND 30000),
  source_name TEXT NOT NULL CHECK(length(source_name) BETWEEN 2 AND 160),
  source_url TEXT NOT NULL CHECK(length(source_url) BETWEEN 12 AND 1200),
  source_published_at TEXT,
  image_url TEXT,
  video_url TEXT,
  media_rights_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(media_rights_confirmed IN (0,1)),
  media_rights_note TEXT NOT NULL DEFAULT '' CHECK(length(media_rights_note) <= 500),
  created_by TEXT NOT NULL,
  published_by TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_news_articles_public_date ON news_articles(status,published_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS news_article_localizations (
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK(length(language_code) BETWEEN 2 AND 5),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 200),
  summary TEXT NOT NULL CHECK(length(summary) BETWEEN 30 AND 700),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 120 AND 30000),
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(article_id,language_code)
);
CREATE TABLE IF NOT EXISTS news_article_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL REFERENCES news_articles(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created','updated','published','unpublished','localized')),
  rationale TEXT NOT NULL DEFAULT '' CHECK(length(rationale) <= 1000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_news_article_events_article ON news_article_events(article_id,created_at);
