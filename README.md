# Address Book Management System

A decoupled **Laravel (API) + React.js (SPA) + MySQL** application for managing an
address book, with token-based authentication (Laravel Sanctum), full CRUD,
server-side search / filtering / pagination, and mirrored client-side validation.

## Tech stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Laravel 13 (PHP 8.4), Sanctum       |
| Frontend  | React 19 + Vite, Tailwind CSS v4    |
| Database  | MySQL 8                             |
| Dev tooling (optional) | Docker + Docker Compose |

## Repository structure

```
address-book-management/
├── backend/            # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/   AuthController, AddressBookController
│   │   ├── Http/Requests/      AddressBookRequest (validation)
│   │   ├── Models/             User, AddressBook
│   │   ├── Policies/           AddressBookPolicy (row-level authorization)
│   │   └── Support/            ApiResponse (response envelope)
│   ├── database/       migrations, factories, seeders
│   ├── routes/api.php  API routes
│   └── tests/Feature/  AuthTest, AddressBookTest
├── frontend/           # React SPA (Vite + Tailwind)
│   └── src/
│       ├── components/ Layout, ProtectedRoute, GuestRoute, Loader, modal
│       ├── contexts/   AuthContext, ToastContext
│       ├── lib/        axios.js (instance + interceptors)
│       └── pages/      Login, Register, AddressBookList, AddressBookForm
├── docker-compose.yml  # Optional: full stack in one command
├── README.md           # This file
├── CLAUDE.md           # Agent/developer context
├── AI_USAGE.md         # How AI tools were used
└── REFACTOR_NOTES.md   # Code-review task write-up
```

---

# Installation

Two paths are documented. The **standard installation** below is the primary,
fully-supported path. Docker is offered afterwards as an optional convenience.

## Standard installation (without Docker)

### Prerequisites

| Requirement | Version |
|-------------|---------|
| PHP         | 8.4 (8.3 minimum) with `pdo_mysql`, `bcmath`, `mbstring`, `openssl` |
| Composer    | 2.x     |
| Node.js     | 24 (see `frontend/.nvmrc`) |
| npm         | 10+ (ships with Node 24) |
| MySQL       | 8.x     |

### 1. Create the database

Connect to MySQL as a privileged user and create the schema plus an application
account:

```sql
CREATE DATABASE address_book CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'address_book'@'localhost' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON address_book.* TO 'address_book'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configure and start the backend

```bash
cd backend

# Install PHP dependencies
composer install

# Create your environment file from the template
cp .env.example .env

# Generate the application key
php artisan key:generate
```

Open `backend/.env` and confirm the database settings match what you created in
step 1:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=address_book
DB_USERNAME=address_book
DB_PASSWORD=secret
```

Then create the tables and load the sample data:

```bash
php artisan migrate
php artisan db:seed
```

Start the API on port 8000:

```bash
php artisan serve
```

The API is now available at **http://127.0.0.1:8000**. Leave this terminal
running and open a second one for the frontend.

### 3. Configure and start the frontend

```bash
cd frontend

# Use the pinned Node version (if you use nvm)
nvm use

# Install JavaScript dependencies
npm install

# Create your environment file from the template
cp .env.example .env
```

`frontend/.env` points the SPA at the API. The default matches the backend above:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the dev server:

```bash
npm run dev
```

### 4. Log in

Open **http://localhost:3000** and sign in with the seeded account:

| Email | Password |
|-------|----------|
| `admin@example.com` | `password` |

You can also register a new account from the login screen.

---

## Optional: run everything with Docker

Docker is **not required** — the standard installation above works on its own.
It is provided as a convenience (and as the assignment's bonus item).

From the repository root:

```bash
docker compose up --build
```

That single command builds the images, waits for MySQL, runs the migrations, and
seeds the database on first boot. No manual `.env`, `composer install`, or
`npm install` step is needed — the containers handle all of it.

| Service    | URL                     |
|------------|-------------------------|
| Frontend   | http://localhost:3000   |
| API        | http://127.0.0.1:8000   |
| phpMyAdmin | http://localhost:8080   |

Sign in with the same seeded credentials (`admin@example.com` / `password`).

Useful commands:

```bash
docker compose exec backend php artisan test      # run the test suite
docker compose exec backend php artisan migrate   # run new migrations
docker compose down -v                            # stop and wipe the database
```

---

# Running the tests

The backend ships with feature tests covering authentication, authorization,
validation, and CRUD.

```bash
cd backend
php artisan test
```

Under Docker:

```bash
docker compose exec backend php artisan test
```

---

# Architecture overview

The two applications are fully decoupled and communicate only over HTTP/JSON.

**Authentication.** The SPA posts credentials to `POST /api/login` and receives a
Laravel Sanctum bearer token, which it stores in `localStorage`. A single Axios
instance (`frontend/src/lib/axios.js`) attaches that token to every request via a
request interceptor, and a response interceptor clears it and redirects to the
login screen on any `401`. No component reads the token or hardcodes a URL.

**Response envelope.** Every endpoint — success or failure — returns the same
shape, produced by the `ApiResponse` helper and a global exception handler in
`bootstrap/app.php`:

```jsonc
// success
{ "status": true,  "message": "...", "data": { } }

// list (paginated)
{ "status": true,  "message": "...", "data": [ ], "meta": { "current_page": 1, "per_page": 15, "total": 51, "last_page": 4 } }

// error
{ "status": false, "message": "...", "errors": { "email": ["..."] } }
```

HTTP status codes are preserved (200, 201, 401, 403, 404, 422, 500), so the
frontend can rely on exactly one structure everywhere.

**Validation** is defined once in `AddressBookRequest` and mirrored by the React
form, which also surfaces server-side 422 errors inline beneath each field.

**Authorization.** All `/api` routes except login and register require a valid
token. Beyond that, `AddressBookPolicy` enforces row-level ownership: any
authenticated user can browse the address book, but only the user who created a
record can update or delete it.

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/register` | Create an account, returns a token |
| `POST` | `/api/login` | Authenticate, returns a token |
| `POST` | `/api/logout` | Revoke the current token |
| `GET`  | `/api/me` | Current authenticated user |
| `GET`  | `/api/address-books` | List records (search, filter, paginate) |
| `POST` | `/api/address-books` | Create a record |
| `GET`  | `/api/address-books/{id}` | Show one record |
| `PUT`  | `/api/address-books/{id}` | Update a record (owner only) |
| `DELETE` | `/api/address-books/{id}` | Delete a record (owner only) |

`GET /api/address-books` accepts `search` (name/email/phone), `gender`,
`nationality`, `age_min`, `age_max`, `page`, and `per_page` (max 100).

---

# Implementation notes

## `address_book.updated_at`

The task's column list is `id, name, phone, email, website, gender, age,
nationality, created_at, created_by` — it does not include `updated_at`.

This implementation **adds `updated_at`** (via Laravel's standard
`$table->timestamps()`). The reasoning: the spec requires full CRUD, so records are
editable in place. A row that can change but only records when it was *created*
loses information on every edit — there is no way to tell a freshly imported
contact from one corrected five minutes ago. Since the column list reads as an
enumeration of the required domain fields rather than a prohibition on Laravel's
conventional timestamp pair, `updated_at` is treated as an additive improvement.

Nothing depends on its absence: all required columns are present with the specified
names and types, and the API response includes `updated_at` as an extra field only.

## Row-level authorization

The specification requires `created_by` to be derived from the authenticated user.
The presence of that column implies ownership, so `AddressBookPolicy` restricts
updates and deletes to the record's creator. Browsing remains open to any
authenticated user.

## Timezone

The application runs on `Asia/Dhaka` (UTC+6), set via `APP_TIMEZONE` in
`backend/.env`. Change that value to suit your own deployment.
