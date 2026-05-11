# Service Layer

SurfSync keeps business logic in `lib/services/`. Server Actions are transport wrappers for the web MVP, and future Route Handlers can wrap the same services for mobile or public API clients.

This convention is the implementation rule that follows from [ADR-0001: API Style for SurfSync MVP](../adr/0001-api-style.md).

## Transport Boundary

Server Actions and Route Handlers should do four things, in order:

1. Authenticate the caller.
2. Validate input with Zod.
3. Call into a service function.
4. Return the result.

They should not contain booking logic, verification state transitions, availability checks, notification orchestration, or database writes beyond simple transport concerns.

## Server Action Shape

```ts
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { bookingService } from "@/lib/services/booking";

const requestBookingInput = z.object({
  instructorId: z.string().uuid(),
  date: z.string().date(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().max(500).optional(),
});

export async function requestBooking(input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const validated = requestBookingInput.parse(input);

  return bookingService.requestBooking({
    ...validated,
    requestedByUserId: session.user.id,
  });
}
```

## Service Shape

Services receive typed inputs, return typed outputs, and own the business rules. They know nothing about HTTP, forms, Server Actions, or React.

```ts
// lib/services/booking.ts
import { db } from "@/lib/db";
import { bookings, instructorAvailability } from "@/lib/db/schema";
import { queueBookingRequestedNotification } from "@/lib/jobs";

export const bookingService = {
  async requestBooking(input: {
    instructorId: string;
    requestedByUserId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    // 1. Resolve the requester's school from membership.
    // 2. Validate against the instructor's weekly availability.
    // 3. Check no overlapping `accepted` booking exists on the date.
    // 4. Insert booking with status = `requested`.
    // 5. Queue notification to the instructor.
    // Return the created booking.
  },
};
```

A service function:

- Takes the caller identity as an explicit argument, usually a `userId`.
- Owns conflict checks, state machine transitions, status validations, and other domain rules.
- Talks to the database through Drizzle.
- Queues background work through the jobs module.
- Does not import `headers()`, `cookies()`, `FormData`, or any Next.js or React API.

## Database Access

- The shared Drizzle client lives in `lib/db/index.ts`.
- Database schemas live in `lib/db/schema/`.
- Services import `db` from `@/lib/db`.
- Feature code should not create its own `Pool` or Drizzle client.

## Anti-Pattern

Do not put business logic directly inside a Server Action:

```ts
// Business logic inside a Server Action
"use server";

export async function requestBooking(formData: FormData) {
  const instructorId = formData.get("instructorId");

  const availability = await db.select().from(instructorAvailability)...;

  const conflicts = await db.select().from(bookings)...;
  if (conflicts.length > 0) throw new Error("Conflict");

  await db.insert(bookings).values(...);

  await queue.send(...);
}
```

When a second client arrives, a Route Handler cannot reuse any of this. Availability validation, conflict checks, booking creation, and notification queueing would all have to be duplicated.

## Review Checklist

- Server Actions and Route Handlers authenticate before doing work.
- Inputs are validated with Zod at the transport boundary.
- Business rules live in `lib/services/`.
- Services take explicit caller context instead of reading request state.
- Third-party calls are queued for background workers where practical.
