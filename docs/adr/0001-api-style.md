# ADR-0001: API Style for SurfSync MVP

**Status:** Accepted
**Date:** 2026-05-11
**Deciders:** Orlando

## Context

SurfSync is a greenfield Next.js (App Router) application. The MVP is web-only, but the product roadmap explicitly includes a native mobile client when the v2 consumer-facing booking layer ships (students booking instructors directly).

We need to pick a pattern for how the frontend talks to backend business logic. The choice has to:

- Minimise ceremony for the web MVP so we don't slow down M0–M5.
- Leave a clean path to add a mobile client later without rewriting business logic.
- Pair well with the rest of the stack (Drizzle, Better-Auth, Zod, Server Components).
- Keep type-safety end-to-end without a heavy framework tax.

The decision is load-bearing: it shapes how every backend module is structured, where validation lives, and how authentication is enforced. Reversing it later requires touching every read and mutation in the app.

## Decision

Use **Next.js Server Actions** for the web MVP, with all business logic kept in a **transport-agnostic service layer** (`lib/services/`).

**The rule:** Server Actions are thin wrappers that handle auth, validate input with Zod, and call into a service function. Services know nothing about HTTP, forms, or React. When the mobile client arrives, REST Route Handlers (`app/api/v1/...`) wrap the same service functions. No business logic gets duplicated; only the transport changes.

```
┌─────────────────────────────┐    ┌──────────────────────────────┐
│  Server Actions (web)       │    │  Route Handlers (mobile, v2) │
│  - auth check               │    │  - auth check                │
│  - Zod validate input       │    │  - Zod validate input        │
│  - call service             │    │  - call service              │
└──────────────┬──────────────┘    └──────────────┬───────────────┘
               │                                  │
               └──────────────┬───────────────────┘
                              │
                      ┌───────▼────────┐
                      │  lib/services/ │
                      │  pure TS,      │
                      │  transport-    │
                      │  agnostic      │
                      └───────┬────────┘
                              │
                      ┌───────▼────────┐
                      │  Drizzle / DB  │
                      └────────────────┘
```

## Options Considered

### Option A: Server Actions + transport-agnostic service layer (chosen)

| Dimension | Assessment |
|---|---|
| Complexity | Low |
| Setup cost | Low — native to App Router, no extra framework |
| Type safety | End-to-end via TypeScript inference |
| Boilerplate | Minimal |
| Path to mobile | Clean — wrap services in Route Handlers when needed |
| Team familiarity | High (Next.js standard pattern) |

**Pros**
- Native to Next.js App Router; no extra dependencies.
- Form submissions and mutations feel idiomatic — no fetch wrappers, no API client boilerplate.
- Excellent DX for the web MVP, which is the only client at launch.
- The service-layer split is a free win that pays off later.
- Zod fits naturally as the validation boundary in both Server Actions and (future) Route Handlers.

**Cons**
- Server Actions are web-only — when mobile arrives, an additional transport layer is required (acceptable cost, mitigated by the service-layer rule).
- Less rigid contract than REST or tRPC — depends on convention rather than tooling to enforce structure.
- Server Actions are still evolving as a Next.js feature; some patterns (e.g., progressive enhancement edge cases) are still settling.

### Option B: REST Route Handlers from day one

| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Setup cost | Medium — REST conventions, fetch wrappers, manual type wiring |
| Type safety | Manual — Zod schemas shared between client and server |
| Boilerplate | High |
| Path to mobile | Already there |
| Team familiarity | Universal (REST is REST) |

**Pros**
- A real API exists from day one, ready for mobile or third-party consumers.
- Clear separation between client and server; no framework-specific magic.
- Easier to debug with standard HTTP tooling (curl, Postman).
- Versionable from the start.

**Cons**
- Significant boilerplate for a single (web) consumer. We'd be writing a REST API and a fetch client on top of it for no MVP benefit.
- Loses the ergonomic wins of Server Actions for forms and mutations.
- Type-safety requires manual schema sharing and route-typing conventions.

### Option C: tRPC

| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Setup cost | Medium — router setup, client provider, procedure conventions |
| Type safety | End-to-end automatic (the headline feature) |
| Boilerplate | Low once set up |
| Path to mobile | Workable but less idiomatic |
| Team familiarity | Variable |

**Pros**
- Best-in-class end-to-end type safety, automatic across the network boundary.
- Strong opinionated conventions (procedures, routers) keep the codebase coherent.
- Mature ecosystem of plugins (auth, caching, etc.).
- Compatible with React Native if mobile is JS/TS-based.

**Cons**
- Real setup cost (router scaffolding, client provider, middleware) that pays off only once you have multiple clients.
- For a future React Native mobile client, tRPC works but feels less idiomatic than REST.
- Locks the API style to TypeScript on both ends; not ideal if mobile ends up Swift/Kotlin-native or if third-party integrations need a public API.
- Paying complexity tax today for a benefit ("typed mobile client") we won't realise for months.

## Trade-off Analysis

The decision boils down to: **how much setup tax are we willing to pay today for a benefit we won't realise until v2?**

Route Handlers (Option B) and tRPC (Option C) both pay that tax up front — REST gives us a mobile-ready API today; tRPC gives us end-to-end type safety today. Neither benefit is useful at MVP, where there's exactly one client (the Next.js web app).

Server Actions (Option A) defer the cost entirely. The web MVP gets the lowest-friction path possible, and the **service-layer split** is the architectural rule that prevents this from becoming a problem later. When mobile lands, we add Route Handlers (or migrate to tRPC) as a transport wrapper around the same services. The business logic — validation rules, booking conflict checks, verification state machine, search query logic — moves once, lives forever in `lib/services/`, and never gets duplicated.

The only real risk of Option A is **discipline**: if engineers put business logic directly in Server Actions instead of calling services, the future mobile transition becomes a refactor rather than a wrapper. This is mitigated by setting the service-layer convention in M0 and enforcing it in code review.

The mobile-language choice (React Native vs. native Swift/Kotlin) is also relevant. If it's React Native, tRPC becomes more attractive when mobile arrives. If it's native, REST is the natural transport. Either way, the service layer is the constant, and migrating from Server Actions to a complementary transport is a straightforward wrapping exercise.

## Consequences

**What becomes easier**
- Forms, mutations, and data fetching are idiomatic Next.js code with minimal ceremony.
- Validation happens at a single, clear boundary (Server Action → Zod → service).
- Auth checks (Better-Auth) happen at the Server Action layer; services receive clean, authenticated inputs.
- M0–M5 ship faster because there's no parallel REST API to design and maintain.

**What becomes harder**
- Adding the mobile client (post-v2) requires building a REST or tRPC transport layer from scratch. Acceptable cost, isolated to a single piece of work.
- No public HTTP API exists, so third-party integrations (if any are needed before mobile) require an ad-hoc Route Handler.
- Server Actions are web-only — any debugging or scripting that wants to hit the backend from outside the browser needs to call services directly (e.g., in scripts) or go through a Route Handler.

**What we'll need to revisit**
- When mobile work begins (triggered by the v2 consumer booking layer), decide between:
  - Adding REST Route Handlers (`app/api/v1/...`) for the mobile client, or
  - Migrating to tRPC if mobile is React Native and end-to-end type safety is worth the migration.
- The service-layer discipline should be checked in code review on every PR until the convention is muscle memory.

## Action Items

1. [x] Establish the `lib/services/` directory and convention as part of M0 (repo scaffolding).
2. [x] Document the service-layer convention and copyable examples in [`docs/architecture/service-layer.md`](../architecture/service-layer.md).
3. [x] Add the standard shape of a Server Action (auth check -> Zod validate -> call service -> return result) to the service-layer guide.
4. [ ] Reassess this ADR when mobile development is scoped; decide REST vs. tRPC at that point and supersede this ADR if needed.
