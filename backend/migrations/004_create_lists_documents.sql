CREATE TABLE IF NOT EXISTS lists_documents (
  listId INTEGER NOT NULL,
  documentId INTEGER NOT NULL,
  PRIMARY KEY (listId, documentId),
  FOREIGN KEY (listId) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
);

-- Migrate existing documents into their owner's default list
INSERT OR IGNORE INTO lists_documents (listId, documentId)
SELECT l.id, d.id
FROM documents d
JOIN lists l ON l.userId = d.userId AND l.name = 'default';
