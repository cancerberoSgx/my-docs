# Frontend

React + TypeScript SPA with DaisyUI styling and Zustand state management.

## Requirements

- Node.js >= 18
- npm
- Backend running on `http://localhost:3001`

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the app on `http://localhost:3000`. API requests to `/auth`, `/register`, and `/documents` are proxied to the backend at `http://localhost:3001`.

## Production build

```bash
npm run build
```

Output is in `dist/`. Serve it with any static file server. Make sure to configure your server to proxy or rewrite API routes to the backend.

## Features

- **Register** — create a new account via `POST /register`
- **Login** — sign in via `POST /auth`
- **Session persistence** — JWT token is stored in `localStorage` and survives page reloads
- **Auto logout** — if the token is expired or invalid, the user is redirected back to the login screen
- **Documents** — authenticated users see their document list from `GET /documents`

## Tech stack

| Library     | Purpose                        |
|-------------|--------------------------------|
| React 18    | UI rendering                   |
| Zustand     | Global state + localStorage persistence |
| DaisyUI     | Component styles (Tailwind CSS) |
| Vite        | Dev server and bundler         |
