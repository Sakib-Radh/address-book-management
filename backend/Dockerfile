# Backend image: PHP 8.3 CLI with the extensions Laravel + MySQL need.
FROM php:8.3-cli

# System libraries required to build the PHP extensions.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring zip bcmath \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer (copied from the official Composer image).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

EXPOSE 8000

# Entrypoint installs dependencies, waits for MySQL, runs migrations, then serves.
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
