-- Rename 'admin' to 'root'
UPDATE users SET role = 'root' WHERE role = 'admin';

-- Add created_at to users (existing rows get current timestamp as approximation)
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add created_at to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Seed test user (role: user, password: 1234)
INSERT INTO users (email, password, role)
SELECT 'user@test.com', '$2a$10$e7Ior6OGn0hsaYQbCbboG.XttOZh.XpK68bzNv5m6kjKNfB8uF0sO', 'user'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@test.com');
