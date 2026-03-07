CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

INSERT OR IGNORE INTO users (email, password, role)
VALUES ('sebastigurin@gmail.com', '$2a$10$cqJv0C8jtYLV2G9bejVdaeQppbohH/Jov7uUBmyiOwVOoXfT8AIK2', 'admin');
-- default password is "password"
