#!/bin/sh
set -e

cd /var/www/html

# Ensure a .env exists (evaluator may only have .env.example after cloning).
if [ ! -f .env ]; then
  echo "==> No .env found; creating from .env.example"
  cp .env.example .env
fi

# Point .env at the MySQL *service* rather than .env.example's 127.0.0.1 default.
#
# This is not redundant with the `environment:` block in docker-compose.yml.
# `php artisan serve` spawns worker processes and passes through only an
# allow-listed set of environment variables (ServeCommand::$passthroughVariables),
# which does not include DB_*. So compose's env vars reach this script and the
# migration command, but NOT the workers handling HTTP requests — those fall back
# to .env. Without this, migrations succeed while every query during a request
# fails with "Connection refused (Host: 127.0.0.1)".
echo "==> Aligning .env database settings with the container environment"
set_env() {
  key="$1"
  value="$2"
  [ -z "$value" ] && return 0
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
}
set_env DB_HOST "$DB_HOST"
set_env DB_PORT "$DB_PORT"
set_env DB_DATABASE "$DB_DATABASE"
set_env DB_USERNAME "$DB_USERNAME"
set_env DB_PASSWORD "$DB_PASSWORD"

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

# Run migrations (idempotent).
php artisan migrate --force

# Seed once, on a genuinely empty database, so a fresh clone lands on a login
# screen that can actually be used (admin@example.com / password).
#
# Guarded rather than unconditional: DatabaseSeeder creates the admin with
# updateOrCreate (safe to repeat) but adds 50 address book records each run,
# so re-seeding on every boot would pile up duplicates.
if [ "$(php artisan tinker --execute='echo \App\Models\AddressBook::count();' 2>/dev/null | tr -cd '0-9')" = "0" ]; then
  echo "==> Empty database detected; seeding admin user + sample records"
  php artisan db:seed --force
else
  echo "==> Database already contains data; skipping seed"
fi

echo "==> Starting Laravel dev server on 0.0.0.0:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
