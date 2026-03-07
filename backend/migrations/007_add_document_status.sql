ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'empty';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status_change_error TEXT;
UPDATE documents SET status = 'ready' WHERE type = 'webpage';
UPDATE documents SET status = 'empty' WHERE type = 'youtube';
