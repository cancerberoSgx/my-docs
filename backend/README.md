# Backend

Node.js + Express REST API with SQLite and JWT authentication.

## Requirements

- Node.js >= 22.5 (uses built-in `node:sqlite`)
- npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the server on `http://localhost:3001` with file-watch restart.

## Production

```bash
npm run build
npm start
```

## Environment variables

| Variable     | Default                  | Description              |
|--------------|--------------------------|--------------------------|
| `PORT`       | `3001`                   | HTTP port                |
| `JWT_SECRET` | `change_me_in_production`| Secret used to sign JWTs |

Set these in a `.env` file or your deployment environment. **Always set `JWT_SECRET` in production.**

## Migrations

SQL migration files live in `migrations/`. They are run automatically on startup in filename order. Each file is only ever executed once (tracked in the `_migrations` table).

To add a new migration, create a file like `003_add_column.sql` in the `migrations/` folder.

## API

### POST /register

Create a new account.

**Body:** `{ "email": string, "password": string }`

**Response 201:** `{ "token": string }`

**Response 409:** email already taken.

---

### POST /auth

Sign in with an existing account.

**Body:** `{ "email": string, "password": string }`

**Response 200:** `{ "token": string }`

**Response 401:** invalid credentials.

---

### GET /documents

List documents belonging to the authenticated user.

**Header:** `Authorization: Bearer <token>`

**Response 200:** `[{ "id", "userId", "url", "platform" }]`

**Response 401:** missing or invalid token.

## Default user

| Email                 | Password   | Role  |
|-----------------------|------------|-------|
| admin@example.com     | password   | admin |
