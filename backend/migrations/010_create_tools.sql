CREATE TABLE IF NOT EXISTS tools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tool_document_types (
  tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  PRIMARY KEY (tool_id, document_type)
);

INSERT INTO tools (name, description) VALUES
  ('youtube-audio', 'Extracts audio track from a YouTube video'),
  ('youtube-video', 'Downloads the video file from a YouTube URL'),
  ('webpage-text',  'Extracts plain text content from a webpage')
ON CONFLICT DO NOTHING;

INSERT INTO tool_document_types (tool_id, document_type)
SELECT id, 'youtube' FROM tools WHERE name = 'youtube-audio'
ON CONFLICT DO NOTHING;

INSERT INTO tool_document_types (tool_id, document_type)
SELECT id, 'youtube' FROM tools WHERE name = 'youtube-video'
ON CONFLICT DO NOTHING;

INSERT INTO tool_document_types (tool_id, document_type)
SELECT id, 'webpage' FROM tools WHERE name = 'webpage-text'
ON CONFLICT DO NOTHING;
