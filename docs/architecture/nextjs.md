# Next.js Conventions

SurfSync uses Next.js App Router with TypeScript, Tailwind CSS, ESLint, Turbopack, and the `@/*` import alias.

These conventions complement the generated Next.js defaults and the local `/next-best-practices` and `/nextjs` skills.

## Components

- Prefer Server Components by default.
- Use Client Components only for interactivity, stateful browser behavior, or browser-only APIs.
- Do not make Client Components `async`.
- Keep props crossing React Server Component boundaries serializable.
- Use Suspense boundaries around client hooks that can trigger client-side rendering bailouts, such as `useSearchParams`.

## UI Components

- Base UI components should come from Shadcn/ui.
- Before creating a custom primitive, check whether Shadcn/ui already provides the component or an appropriate composition pattern.
- Create custom components only when Shadcn/ui does not provide a suitable base, or when the component encodes SurfSync-specific product behavior.
- Keep custom components built on top of Tailwind and existing Shadcn/ui primitives where practical.

## App Router APIs

- Treat `params`, `searchParams`, `cookies()`, and `headers()` as async APIs on current Next.js versions.
- Use `redirect()`, `notFound()`, `unauthorized()`, and `forbidden()` where route behavior should be handled by Next.js instead of generic errors.
- Keep Route Handlers focused on HTTP concerns. Business logic belongs in services.

## Runtime

- Default to the Node.js runtime.
- Use Edge runtime only when there is a specific latency, middleware, or platform reason and the dependencies are Edge-compatible.

## Assets And Loading

- Use `next/image` instead of raw `<img>` for app images.
- Use `next/font` for local or Google fonts.
- Use `next/script` for third-party scripts; inline scripts need stable `id` values.

## Data And Mutations

- Fetch data in Server Components when possible.
- Use Server Actions for web mutations.
- Use Route Handlers for webhooks, external HTTP clients, and future mobile/API transports.
- Avoid request waterfalls by starting independent work together with `Promise.all`, preload patterns, or Suspense where appropriate.
