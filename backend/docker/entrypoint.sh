#!/bin/sh
set -e

cd /var/www/html

# Install PHP dependencies if they aren't present yet (vendor/ lives in a named volume).
if [ ! -d vendor ] || [ ! -f vendor/autoload.php ]; then
  echo "==> Installing Composer dependencies..."
  composer install --no-interaction --prefer-dist --no-progress
fi

# Ensure an application key exists.
if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then
  echo "==> Generating application key..."
  php artisan key:generate --force
fi

# Wait for MySQL to accept connections before migrating.
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
