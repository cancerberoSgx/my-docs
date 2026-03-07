# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # development server with watch (http://localhost:3001)
npm run build     # compile TypeScript to dist/
npm start         # run compiled output (requires build first)
```

No test runner is configured.

## Architecture

Node.js >= 22.5 is required — the app uses Node's built-in `node:sqlite` (via `DatabaseSync` from `node:sqlite`), not a third-party SQLite package.

**Request flow:** `src/index.ts` creates the Express app, mounts all routes under `/api`, then calls `runMigrations()` on startup.

**Authentication:** `src/auth.ts` exports `requireAuth` (Express middleware), `signToken`, and `verifyToken`. JWTs carry `{ userId, email, role }`. Protected routes cast `req` to `AuthRequest = Request & { user: JwtPayload }` to access the user.

**Database:** `src/db.ts` exports a single shared `db: DatabaseSync` instance used directly in route handlers — there is no ORM or repository layer. WAL mode and foreign keys are enabled at startup.

**Migrations:** SQL files in `migrations/` run automatically on startup in filename order, tracked in the `_migrations` table. Each file runs exactly once.

**Data model:**
- `users` — email + bcrypt password + role
- `lists` — belong to a user; each user gets a `"default"` list on registration (the default list cannot be deleted)
- `documents` — belong to a user (url + platform)
- `lists_documents` — many-to-many join between lists and documents

All document routes live in `src/routes/listRoutes.ts`.

## Environment variables

| Variable     | Default                   |
|--------------|---------------------------|
| `PORT`       | `3001`                    |
| `JWT_SECRET` | `change_me_in_production` |
