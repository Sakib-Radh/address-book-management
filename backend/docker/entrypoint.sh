#!/bin/sh
set -e

cd /var/www/html

# Ensure a .env exists (evaluator may only have .env.example after cloning).
if [ ! -f .env ]; then
  echo "==> No .env found; creating from .env.example"
  cp .env.example .env
fi

# vendor/ is provided by the image (seeded into a named volume). Only install
# if it is genuinely missing (e.g. volume was wiped).
if [ ! -f vendor/autoload.php ]; then
  echo "==> vendor missing; installing Composer dependencies..."
  composer install --no-interaction --prefer-dist --no-progress
fi

# Generate an application key if one isn't set.
if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then
  echo "==> Generating application key..."
  php artisan key:generate --force
fi

# Rebuild Laravel's package manifest (skipped during the image build).
php artisan package:discover --ansi || true

# Wait for MySQL to accept TCP connections before migrating.
echo "==> Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
until php -r "exit(@fsockopen(getenv('DB_HOST'), (int)getenv('DB_PORT')) ? 0 : 1);"; do
  echo "    ...still waiting for MySQL"
  sleep 2
done
echo "==> MySQL is up."

# Run migrations (idempotent). Seeding is handled separately (see README).
php artisan migrate --force

echo "==> Starting Laravel dev server on 0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
