# Environment Variables

Environment variables are loaded from `.env` in local development. Do not commit real secrets.

Use `.env.example` as the committed contract for required keys.

## Naming

- Use uppercase snake case for environment variable names.
- Use service prefixes for third-party integrations, for example `BETTER_AUTH_*`.
- Keep public browser-exposed values explicitly prefixed with `NEXT_PUBLIC_`.
- Prefer complete URLs such as `DATABASE_URL` over separate host/user/password variables unless a tool specifically requires split values.

## Required Local Keys

- `DATABASE_URL`: Neon Postgres connection string used by Drizzle and Better Auth. Prefer `sslmode=verify-full` for local and deployed connections.
- `BETTER_AUTH_SECRET`: Better Auth signing secret.
- `BETTER_AUTH_URL`: Base URL where the app is running, usually `http://localhost:3000` locally.
- `BETTER_AUTH_API_KEY`: Better Auth infrastructure API key for dashboard endpoints.
