# AGENTS.md — SurfSync

Instructions for AI agents working on this codebase.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project

SurfSync is a two-sided subscription marketplace connecting verified surf instructors with surf schools in the Lisbon coastal area for on-demand class staffing. Schools search a pool of vetted instructors, view their weekly availability, and book them for specific dates. Instructors are verified through Sumsub (identity) and an in-house review of their certification documents. A future v2 will add a consumer-facing booking layer with per-booking commission.

## Tech stack

- **Framework:** Next.js (App Router)
- **Hosting / infra:** Vercel
- **Database:** Postgres on Neon
- **ORM:** Drizzle
- **Object storage:** Vercel Storage (Blob)
- **Auth:** Better-Auth
- **Identity verification:** Sumsub (no ID documents stored on SurfSync infrastructure)
- **Email:** Resend + React Email
- **Background jobs:** Vercel Queue
- **Error tracking:** Sentry
- **Validation:** Zod
- **Date/time:** date-fns
- **CSS / UI:** Tailwind + Shadcn/ui
- **i18n:** next-intl (Portuguese at launch)

## Architectural conventions

### Next.js

Use App Router conventions and keep React Server Component boundaries explicit. Prefer Server Components by default, add `"use client"` only for interactivity or browser APIs, and keep props crossing the server/client boundary serializable.

Base UI components should come from Shadcn/ui. Create custom components only when Shadcn/ui does not provide a suitable base or composition pattern.

For project-specific Next.js conventions, see [`docs/architecture/nextjs.md`](./docs/architecture/nextjs.md).

Auth conventions live in [`docs/architecture/auth.md`](./docs/architecture/auth.md). Environment variable conventions live in [`docs/architecture/environment.md`](./docs/architecture/environment.md).

### Service layer

All business logic lives in `lib/services/`. Server Actions and any future Route Handlers are thin transport wrappers that do four things, in order:

1. Authenticate the caller (Better-Auth).
2. Validate input with Zod.
3. Call into a service function.
4. Return the result.

Services:

- Know nothing about who called them or how. No `headers()`, no `cookies()`, no `formData`. If they need the calling user, they take a `userId` argument.
- Receive typed inputs, return typed outputs.
- Own the business rules (conflict checks, state machine transitions, status validations).
- Talk to the DB via Drizzle and to background work via the jobs module.

For implementation examples and anti-patterns, see [`docs/architecture/service-layer.md`](./docs/architecture/service-layer.md). For the API-style decision context and trade-offs, see [`docs/adr/0001-api-style.md`](./docs/adr/0001-api-style.md).

**Code review rule.** If a Server Action or Route Handler does anything beyond auth, validation, service call, and return, push back. If a service function reaches for `headers()`, `cookies()`, `FormData`, or any Next.js / React API, push back.

## Working style

- Surface trade-offs before locking choices. When proposing an implementation, name the alternatives and what would make us pick differently.
- Validate at the boundary, every time. Every Server Action, every Route Handler, every webhook handler runs input through Zod before doing anything else.
- Errors flow to Sentry from server, client, and queue workers alike. No silent catches.
- Background work is for anything that calls a third party. Sumsub, Resend, and similar calls happen in queue workers, not inline in request handlers. Webhook handlers are idempotent.
