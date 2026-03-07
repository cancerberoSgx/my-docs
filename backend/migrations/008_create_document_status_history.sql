CREATE TABLE IF NOT EXISTS document_status_history (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_url TEXT,
  resolved_mimetype TEXT,
  resolved_extra JSONB
);
