# CLAUDE.md — Project context for AI agents & new developers

## What this project is
A decoupled Address Book manager: a Laravel REST API (`backend/`) and a React SPA
(`frontend/`), authenticated with Laravel Sanctum tokens, backed by MySQL.

## Tech stack
- **Backend:** Laravel 13, PHP 8.3, Laravel Sanctum (token auth)
- **Frontend:** React 19, Vite, Tailwind CSS v4, Axios, React Router
- **Database:** MySQL 8
- **Optional dev tooling:** Docker + Docker Compose

## Folder map
```
backend/    Laravel API — app/, routes/api.php, database/migrations, tests/
frontend/   React SPA  — src/, .nvmrc (Node 24), .env(.example)
docker-compose.yml  backend :8000, frontend :3000, mysql :3306, phpmyadmin :8080
```

## Conventions
- The domain table is `address_book`; columns: `id, name, phone, email, website,
  gender, age, nationality, created_at, created_by`. **No `updated_at`** (matches
  the task spec — `AddressBook` model sets `const UPDATED_AT = null`).
- `created_by` is always derived from the authenticated user, never from client input.
- Validation lives in Form Requests (`StoreAddressBookRequest`, `UpdateAddressBookRequest`);
  the React form mirrors these rules and also surfaces server-side 422 errors.
- No hardcoded URLs/tokens in the frontend — use `VITE_API_BASE_URL` + an Axios interceptor.

## Commands
Docker-first workflow (host has no PHP/Composer). Tooling runs in containers.

| Task | Command |
|------|---------|
| Start full stack | `docker compose up --build` |
| Backend artisan  | `docker compose exec backend php artisan <cmd>` |
| Run migrations   | `docker compose exec backend php artisan migrate` |
| Seed database    | `docker compose exec backend php artisan db:seed` |
| Backend tests    | `docker compose exec backend php artisan test` |
| Frontend deps    | `docker compose exec frontend npm install` |
| Frontend build   | `docker compose exec frontend npm run build` |

Native equivalents (see README) drop the `docker compose exec <service>` prefix.
