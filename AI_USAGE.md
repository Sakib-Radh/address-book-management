# AI_USAGE.md

This project was built with the assistance of AI coding tools. This document
records how they were used, following the task's three prompts. It is updated
incrementally as the project is built (not written retrospectively at the end).

## Which parts used AI
- _(to be filled in as work progresses)_

## One prompt / approach that worked well
- _(to be filled in)_

## One instance where AI was wrong or suboptimal — and how it was caught & fixed
- _(to be filled in)_

---

### Running log (raw notes, cleaned up later)
- **Phase 1 — scaffolding:** Used AI to drive a Docker-first scaffold because the
  host had no PHP/Composer/MySQL. Laravel and the Vite/React app were generated via
  the `composer` and `node:24` containers, then Tailwind v4 was wired into Vite.
- **Bug caught — Docker build failed on `apt`:** The first backend `Dockerfile`
  installed PHP extensions via `apt-get`, which failed behind a caching proxy
  (HTTP 500 from Debian mirrors). Reworked the image to avoid apt entirely:
  a multi-stage build installs Composer deps in the `composer` image, and the
  runtime compiles `pdo_mysql`/`bcmath` from PHP's bundled sources (no network).
- **Bug caught — PHP version mismatch:** vendor packages were resolved on PHP 8.4
  (Composer image) but the runtime image was PHP 8.3, causing a platform-check
  fatal error on boot. Fixed by standardizing the runtime on PHP 8.4.
