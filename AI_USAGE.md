# AI_USAGE.md

This project was built with the assistance of AI coding tools (Claude Code). This
document records how they were used, following the task's three questions. It is
maintained incrementally as the project is built — capturing only substantive,
valuable prompts and real bugs, not routine back-and-forth.

## Which parts of the work used AI
- **Planning:** Turning the raw task into a phased `IMPLEMENTATION_PHASES.md`, then
  reviewing that plan against every stated requirement before writing code.
- **Scaffolding (Phase 1):** Generating the Laravel API and React/Vite/Tailwind SPA
  entirely through Docker containers (host had no PHP/Composer/MySQL).
- **Docker setup & debugging:** Authoring `docker-compose.yml` and the backend image,
  then diagnosing build/runtime failures from container logs.
- _(Later phases will be added as they are built.)_

## One prompt / approach that worked well

**Approach: a phase-by-phase implementation plan, where each phase is a self-contained
prompt mapped 1:1 to the task requirements.** Example of one such phase prompt:

> "Your task is Phase 2. In the `backend` Laravel project: create the `AddressBook`
> model, migration, factory, and seeder with columns `id, name, phone, email,
> website, gender, age, nationality, created_at, created_by` (no `updated_at`);
> set up Sanctum with login/logout; add `StoreAddressBookRequest` /
> `UpdateAddressBookRequest`; build `AddressBookController` with CRUD + pagination +
> search (name/email/phone) + filters (gender, nationality, age range); ensure
> `created_by` is derived from the authenticated user, never client input."

Why it worked: each prompt is small, reviewable, and traceable back to a specific
requirement, which kept the build incremental (one concern per commit) and made it
easy to verify nothing in the spec was missed.

**Debugging micro-approach that worked:** rather than guessing at Docker failures,
reproduce the exact failing step (`docker compose build backend`) and read
`docker compose logs backend`. This surfaced the real root causes directly instead
of trial-and-error edits.

## One instance where AI was wrong / suboptimal — and how it was caught & fixed

The AI-generated backend `Dockerfile` initially:
1. Installed PHP extensions via `apt-get`, which failed on this network behind an
   apt caching proxy (HTTP 500 from the Debian mirrors), and
2. After that was reworked into a multi-stage build, produced a **PHP version
   mismatch** — vendor packages were resolved on PHP 8.4 (the Composer image) but
   the runtime image was pinned to PHP 8.3, causing a `platform_check.php` fatal
   error and a container restart loop.

**How it was caught:** by actually building and booting the stack and reading the
container logs — the fatal error stated `require a PHP version ">= 8.4.1". You are
running 8.3.32` explicitly.

**Fix:** made the image apt-free (compile `pdo_mysql`/`bcmath` from PHP's bundled
sources; install Composer deps in the `composer` image) and standardized both build
and runtime on PHP 8.4. Verified all four services return HTTP 200.
