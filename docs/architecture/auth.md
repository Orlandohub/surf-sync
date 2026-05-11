# Auth

SurfSync uses Better Auth for authentication and session management.

## Filesystem

- `lib/auth/server.ts` owns the server-side Better Auth instance.
- `lib/auth/client.ts` owns the browser auth client helper.
- `app/api/auth/[...all]/route.ts` mounts the Better Auth handler.
- `lib/db/schema/auth.ts` contains the Better Auth Drizzle tables plus SurfSync user fields.

## User Model

Better Auth owns the core `user`, `session`, `account`, and `verification` tables.

SurfSync extends `user` with:

- `type`: `school_staff` or `instructor`.
- `phone`: optional phone number.
- `last_login_at`: nullable login timestamp for future account activity tracking.

The Drizzle property is `user.name`, but the database column is `full_name` to match the SurfSync data model.

Passwords are stored by Better Auth in `account.password`, not on `user.password_hash`.

## Product Rules

Product signup flows should set `type` explicitly. The database default is `school_staff` only so Better Auth dashboard-created users and invites can be inserted safely.
