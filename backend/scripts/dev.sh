#!/bin/sh
set -e

docker compose up -d postgres

echo "Waiting for postgres to be ready..."
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

npm run dev:server
