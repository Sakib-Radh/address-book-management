# Address Book Management System

A decoupled **Laravel (API) + React.js (SPA) + MySQL** application for managing an
address book, with token-based authentication (Laravel Sanctum), full CRUD,
server-side search / filtering / pagination, and mirrored client-side validation.

> **Status:** Phase 1 (scaffolding) complete. Setup instructions below will be
> finalized in a later phase. See `IMPLEMENTATION_PHASES.md` (in the parent
> directory) for the build plan.

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
├── frontend/           # React SPA (Vite + Tailwind)
├── docker-compose.yml  # Optional: full stack in one command
├── README.md           # This file
├── CLAUDE.md           # Agent/developer context
├── AI_USAGE.md         # How AI tools were used
└── REFACTOR_NOTES.md   # Code-review task write-up
```

## Quick start (Docker — optional)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://127.0.0.1:8000
- phpMyAdmin: http://localhost:8080

## Quick start (without Docker)

_Full, step-by-step non-Docker instructions (prerequisites, `.env` setup,
`composer install`, `npm install`, migrations, seeding, running both apps,
seeded credentials, and how to run tests) will be completed in Phase 5._

Prerequisites: PHP 8.4, Composer 2, Node 24 (see `frontend/.nvmrc`), MySQL 8.

## Deliberate deviations from the spec

### `address_book.updated_at`

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

