# AI_USAGE.md

## AI Tools Used

This project was developed with the assistance of **Claude Code** and **ChatGPT**.

- **Claude Code** was used primarily for implementation, code generation, refactoring, debugging, and test generation.

- **ChatGPT** was used for architectural discussions, reviewing design decisions, improving documentation (README, AI_USAGE, REFACTOR_NOTES), and clarifying framework concepts when needed.

Both tools were used as development assistants. All generated code, documentation, and suggestions were manually reviewed, modified where necessary, and verified before being committed.

---

## Which Parts of the Work Used AI

AI was used to assist with the following tasks:

* Breaking the assignment into implementation phases before development.
* Scaffolding the Laravel API and React application.
* Implementing Laravel Sanctum authentication.
* Creating Laravel Form Requests for request validation.
* Building the CRUD API with pagination, search, and filtering.
* Generating the initial React components, authentication flow, routing, and Axios interceptor.
* Reviewing project architecture and suggesting improvements following Laravel and React best practices.
* Assisting with Docker configuration (bonus feature) and documentation.
* Generating PHPUnit test cases and suggesting additional edge cases for validation, authentication, and CRUD operations.

AI was treated as a collaborative development tool rather than an authority. Every generated solution was manually reviewed and refined before becoming part of the final implementation.

---

## Effective Prompt / Approach

Instead of asking AI to generate the entire project at once, I divided the implementation into small, independent phases and asked it to focus on one feature at a time.

Example prompt:

> Implement only the Address Book CRUD API using Laravel best practices. Use Form Requests for validation, keep controllers thin, derive `created_by` from the authenticated user, implement pagination, search and filtering, and explain any architectural decisions. Do not implement unrelated features.

This approach produced smaller, reviewable changes that were easier to understand, test, and refine. It also helped maintain a cleaner commit history and reduced the amount of generated code requiring correction.

A second approach that paid off was defining the API response contract once, up front, rather than letting each endpoint invent its own shape:

> Standardize every API response into one envelope: `status` (true/false), `message` (human-readable), and `data` (when present). Errors return `status: false` with the exception's message and the correct HTTP status code. Add a single global exception handler that produces this shape, so it is reused everywhere instead of repeating try/catch in controllers.

This produced one `ApiResponse` helper plus a global handler in `bootstrap/app.php`, so controllers never handle errors inline and the React app can rely on exactly one structure for both success and failure.

---

## Where AI Was Incorrect or Suboptimal

Although AI significantly accelerated development, several implementation decisions required manual review and correction.

### 1. Missing row-level authorization

The initial implementation correctly protected all CRUD endpoints using Laravel Sanctum, as required by the assignment. However, it allowed any authenticated user to update or delete any address book record.

While reviewing the implementation, I noticed that the database schema includes a `created_by` field. Although the specification only requires this field to be derived from the authenticated user, its presence strongly suggests ownership of each record.

Based on this observation, I introduced a Laravel Policy (`AddressBookPolicy`) to enforce row-level authorization:

* Any authenticated user can browse the address book.
* Only the user who created a record can update or delete it.

`Gate::authorize()` calls were added to the controller's `update` and `destroy` methods, and the frontend was updated to conditionally render the Edit/Delete buttons based on `record.created_by === user?.id`.

This change aligns the application with common security practices and demonstrates that AI-generated code should always be reviewed for implied business rules, not just explicit requirements.

### 2. Docker build failures and a PHP version mismatch

The AI-generated backend `Dockerfile` initially installed PHP extensions via `apt-get`, which failed on this network behind an apt caching proxy (HTTP 500 from the Debian mirrors). After that was reworked into a multi-stage build, it produced a **PHP version mismatch**: vendor packages were resolved on PHP 8.4 (the Composer image) while the runtime image was pinned to PHP 8.3, causing a `platform_check.php` fatal error and a container restart loop.

**How it was caught:** by actually building and booting the stack rather than assuming it worked. The container logs stated the problem explicitly — `require a PHP version ">= 8.4.1". You are running 8.3.32`.

**Fix:** the image was made apt-free (compiling `pdo_mysql`/`bcmath` from PHP's bundled sources and installing Composer dependencies in the `composer` image), and both build and runtime were standardized on PHP 8.4. All four services were then verified to return HTTP 200.

The wider lesson: rather than guessing at Docker failures, reproduce the exact failing step (`docker compose build backend`) and read `docker compose logs backend`. This surfaced the real root causes directly instead of trial-and-error edits.

### 3. Specification followed too literally (`updated_at`)

During the same review, I also noticed that the specification listed `created_at` but omitted `updated_at`. The AI followed the specification literally and generated the migration without an update timestamp.

Since the application supports editing records, I decided to use Laravel's standard timestamps (`created_at` and `updated_at`) so that modifications are also tracked. This improves auditing and maintainability while remaining fully compatible with the application's requirements. This design decision is documented as an implementation assumption in `README.md`.

---

## Verification

Every AI-generated implementation was manually reviewed before being accepted.

Verification included:

* Reviewing all generated code for readability, maintainability, and adherence to Laravel and React best practices.
* Running AI-assisted automated tests where applicable and reviewing their assertions.
* Manually testing authentication, authorization, CRUD operations, validation, pagination, searching, and filtering.
* Testing edge cases suggested by AI as well as additional scenarios identified during manual testing.
* Running the application end-to-end to ensure all implemented features behaved as expected.

AI significantly accelerated development, documentation, and testing, but all architectural decisions, debugging, validation, and final code review were performed manually before submission.
