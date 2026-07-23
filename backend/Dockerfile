# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: install PHP dependencies using the official Composer image.
# The composer image already bundles git/unzip/zip, so we never touch apt —
# this avoids Debian mirror/proxy issues at build time and keeps builds fast.
# ---------------------------------------------------------------------------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
# Install without running artisan scripts (the app isn't fully copied yet).
# Dev dependencies are included by default (needed for local dev + tests).
RUN composer install --no-interaction --prefer-dist --no-progress --no-scripts

# ---------------------------------------------------------------------------
# Stage 2: runtime image.
# PHP 8.4 to match the Composer image that resolved vendor/ (its packages
# require PHP >= 8.4). pdo_mysql and bcmath compile from PHP's bundled sources
# using the toolchain already present in the php image — no apt / no network.
# ---------------------------------------------------------------------------
FROM php:8.4-cli

RUN docker-php-ext-install pdo_mysql bcmath

# Bring Composer along for artisan/composer commands inside the container.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# App source (overridden by the bind mount in docker-compose during dev, but
# baked in so the image also runs standalone).
COPY . .

# Vendor directory from stage 1. In docker-compose this path is backed by a
# named volume, which Docker seeds from this baked content on first run.
COPY --from=vendor /app/vendor ./vendor

EXPOSE 8000

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
