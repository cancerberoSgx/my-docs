CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

INSERT INTO users (email, password, role)
VALUES ('sebastigurin@gmail.com', '$2a$10$cqJv0C8jtYLV2G9bejVdaeQppbohH/Jov7uUBmyiOwVOoXfT8AIK2', 'admin')
ON CONFLICT DO NOTHING;
-- default password is "password"
