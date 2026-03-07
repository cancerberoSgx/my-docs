CREATE TABLE IF NOT EXISTS lists_documents (
  list_id INTEGER NOT NULL,
  document_id INTEGER NOT NULL,
  PRIMARY KEY (list_id, document_id),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Migrate existing documents into their owner's default list
INSERT INTO lists_documents (list_id, document_id)
SELECT l.id, d.id
FROM documents d
JOIN lists l ON l.user_id = d.user_id AND l.name = 'default'
ON CONFLICT DO NOTHING;
