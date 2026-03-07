ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type_image TEXT;

-- normalize old 'unknown' type to 'webpage'
UPDATE documents SET type = 'webpage' WHERE type = 'unknown';

-- backfill type_image for existing rows
UPDATE documents SET type_image = '/icons/youtube.svg' WHERE type = 'youtube';
UPDATE documents SET type_image = '/icons/webpage.svg'  WHERE type = 'webpage';
