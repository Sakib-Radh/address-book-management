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
