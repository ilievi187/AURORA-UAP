-- Private link between a verified Auth identity and a quarantined report.
-- NO reporter email in D1; Supabase Auth stores verified account email separately.
-- Never expose these links through public cases, archives or moderator HTML.
CREATE TABLE IF NOT EXISTS intake_reporter_links (
 submission_id TEXT PRIMARY KEY REFERENCES intake_submissions(id) ON DELETE CASCADE,
 auth_user_id TEXT NOT NULL CHECK(length(auth_user_id)=36),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_reporter_links_user ON intake_reporter_links(auth_user_id,created_at);
