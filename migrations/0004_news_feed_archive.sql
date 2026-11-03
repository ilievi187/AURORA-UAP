-- Durable, source-attributed metadata for syndicated headlines.
-- No full article text, contact data, IP address, or uploaded media is stored.
-- Rows are intentionally not deleted when an upstream publisher removes a page.
CREATE TABLE IF NOT EXISTS news_feed_archive (
  source_key TEXT PRIMARY KEY CHECK(length(source_key) BETWEEN 12 AND 1200),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 8 AND 280),
  source_name TEXT NOT NULL CHECK(length(source_name) BETWEEN 1 AND 100),
  source_url TEXT NOT NULL CHECK(length(source_url) BETWEEN 12 AND 1200 AND source_url LIKE 'https://%'),
  source_id TEXT NOT NULL DEFAULT '' CHECK(length(source_id) <= 100),
  source_language TEXT NOT NULL DEFAULT 'en' CHECK(length(source_language) BETWEEN 2 AND 5),
  source_role TEXT NOT NULL DEFAULT '' CHECK(length(source_role) <= 60),
  source_region TEXT NOT NULL DEFAULT '' CHECK(length(source_region) <= 120),
  published_at TEXT NOT NULL,
  first_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_news_feed_archive_published ON news_feed_archive(published_at DESC,source_key);
CREATE TABLE IF NOT EXISTS news_feed_archive_editions (
  source_key TEXT NOT NULL REFERENCES news_feed_archive(source_key) ON DELETE CASCADE,
  edition TEXT NOT NULL CHECK(edition IN ('global','bulgaria','official')),
  first_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(source_key,edition)
);
CREATE INDEX IF NOT EXISTS idx_news_feed_archive_edition_date ON news_feed_archive_editions(edition,last_seen_at DESC,source_key);
