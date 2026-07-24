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
- **Backend core logic (Phase 2):** Model/migration/factory/seeder, Sanctum auth,
  Form Request validation, the CRUD controller with search/filter/pagination, a
  standardized API response envelope with a single global exception handler, and
  the PHPUnit feature tests — then verifying the whole API end-to-end over HTTP.
- **Frontend foundation & auth (Phase 3):** The Axios instance with request/response
  interceptors, an `AuthContext` for login/logout/current-user, route guards, and
  the Login screen — wired to the Phase 2 API and verified with a production build.
- _(Phases 4–5 will be added as they are built.)_

## Prompts / approaches that worked well

**1. A standing "engineering quality bar" prompt, applied to every implementation
phase.** Rather than re-specifying quality expectations each time, one reusable
instruction set the bar up front:

> "Design and implement this like a senior software engineer / architect would.
> Standing constraints: no database queries inside loops (avoid N+1 — eager-load or
> batch); prefer the framework's idiomatic construct over ad-hoc code; single,
> reusable abstractions over copy-paste; validate at the boundary; and keep a
> standard, predictable response shape. Before finishing, re-read the diff for
> anything a senior reviewer would flag."

Why it worked: it front-loaded architectural intent, so generated code arrived
already close to review-ready (e.g. filtering built as one fluent query builder
chain instead of repeated `if` blocks) and cut the number of correction rounds.

**2. A single, prescriptive prompt for the API response contract.** Defining the
exact envelope once — instead of letting each endpoint invent its own shape — made
the whole API predictable for the frontend:

> "Standardize every API response into one envelope: `status` (true/false),
> `message` (a human-readable, relatable message), and `data` (when present). Errors
> return `status: false` with the exception's message. Always send the correct HTTP
> status code (200/201/401/404/422/…). Add a single global exception handler that
> receives the exception and produces this shape, so it is reused everywhere instead
> of repeating try/catch in controllers."

Why it worked: it produced one `ApiResponse` helper plus a global handler in
`bootstrap/app.php`, so controllers return envelopes and never handle errors
inline — and the React app can rely on exactly one structure for success and error.

**3. A phase-by-phase implementation plan, where each phase is a self-contained
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

**4. One centralized-auth prompt for the frontend, instead of per-request token
handling.** Defining the auth plumbing once kept every component and API call free
of scattered token reads and hardcoded URLs:

> "Centralize auth in the React app: a single Axios instance whose request
> interceptor attaches the bearer token and whose response interceptor clears it and
> redirects to /login on a 401. Expose login / logout / current-user through one
> `AuthContext`, and gate protected routes with a single guard component. No token
> reads, redirects, or API URLs duplicated across components."

Why it worked: authentication lives in exactly one place, so every screen inherits
it automatically and the Phase 4 CRUD views need zero auth wiring of their own.

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
