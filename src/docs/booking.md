# Booking Module Architectural Contract

This document defines the proposed architecture, persistence contract, business
rules, and HTTP API for the Hotel Management System booking module. It is a
forward-looking contract; the booking model and routes are not yet part of the
current implementation.

## 1. Overview and architecture

The Booking module connects a `Room` to the operational `Guest` who will stay
there for a specified date range. A booking is the source of truth for
date-specific room occupancy; a room's `isAvailable` flag is not sufficient to
determine whether it is available for a particular stay.

Bookings enter the system through two sources:

| Source      | Caller and flow                                                                                 | Guest handling                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `online`    | An authenticated user submits a booking request through the website.                            | Resolve or create the user's `Guest` profile on demand, then associate it with the booking.                                                                          |
| `reception` | An authenticated `Admin` creates a booking for a walk-in guest or assists a guest at reception. | The Admin provides guest details or selects an eligible existing guest profile. Reception-created walk-in profiles have no online `User` association (`user: null`). |

Both entry points use the same availability, capacity, date, and pricing rules.
The client chooses a room and requested stay dates; the server validates the
request and creates the booking. The `source` field records which flow created
the record and is assigned by the server, not trusted from the request body.

### Online guest auto-resolution

For an authenticated online request, call
`ensureGuestForBookingService(userId)` before creating the booking:

1. Look up the `Guest` associated with the authenticated `User`.
2. If one exists, reuse it.
3. If one does not exist, create a `Guest` from the account's available details
   and associate it with that user.
4. Use the resulting guest ID on the booking.

This on-demand strategy avoids creating `Guest` records for website visitors
who never book. The current User model has `userName`, required `email`, and
`phone` (defaulting to an empty string); it has no `name`, `firstName`, or
`lastName` field. The Guest model requires both `firstName` and `lastName`,
while `email` and `phone` are optional. Map the User's `email` to Guest
`email`; this satisfies the guest-create validator's email-or-phone rule
unless the email conflicts with another Guest's unique email. Map `phone` only
when non-empty and valid under the current guest validator's
`/^01[0125][0-9]{8}$/` pattern.

`userName` is a display name with a length constraint but no guarantee that it
contains both a first and last name. The resolver must define and apply an
explicit name-parsing rule that produces non-empty `firstName` and `lastName`.
If it cannot do so, it must fail clearly and require the account/guest profile
to be completed; it must not create a Guest with missing names or fabricated
placeholder values. A Guest email uniqueness conflict must also be surfaced
for reconciliation rather than silently linking a profile by email to a
different User.

No `src/services/guest.service.js` or
`ensureGuestForBookingService(userId)` implementation currently exists. The
above behavior is the required future service contract, not a description of
implemented behavior. The Guest `user` reference currently defaults to `null`
and is not unique. To prevent concurrent booking requests from creating
multiple Guest profiles for one User, the implementation must enforce
uniqueness for non-null User references (for example, with a partial unique
index restricted to ObjectId values) and handle a concurrent create by
loading the already-associated Guest. The index must allow multiple reception
Guest records with `user: null`.

The guest profile is resolved before booking validation, so a rejected booking
(for example, a date conflict) may still leave a Guest profile associated with
the user. This is intentional: the profile is needed for any future booking
attempt and creation is idempotent via the unique `user` reference.

### Reception and walk-in guest resolution

An Admin may provide a guest's details to create a guest profile or select an
existing eligible profile. A profile created for a walk-in guest
without an online account must have `user: null`; it is not linked to an
arbitrary website account. Reception flow must not accept a client-supplied `user` association. When
selecting an existing profile, preserve its stored
user reference rather than changing the association as a side effect of
booking.

## 2. Mongoose booking schema contract

The following is the logical Mongoose contract. The model should use timestamps
and the project's standard JSON transformation so serialized documents expose
`id` and omit internal MongoDB fields.

| Field           | Type                    | Required | Constraints and behavior                                                                                                 |
| --------------- | ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `guest`         | `ObjectId`, ref `Guest` | Yes      | Operational guest staying in the room.                                                                                   |
| `room`          | `ObjectId`, ref `Room`  | Yes      | Room reserved for the stay.                                                                                              |
| `checkInDate`   | `Date`                  | Yes      | Inclusive beginning of the stay.                                                                                         |
| `checkOutDate`  | `Date`                  | Yes      | Exclusive end of the stay; must be later than `checkInDate`.                                                             |
| `guestsCount`   | `Number`                | Yes      | Integer, minimum `1`, and no greater than the selected room's `capacity`.                                                |
| `totalPrice`    | `Number`                | Yes      | Calculated by the server as stay nights multiplied by the room's nightly price. Never accept a client-calculated amount. |
| `status`        | `String`                | No       | Enum: `confirmed`, `checked-in`, `checked-out`, `cancelled`; default `confirmed`.                                        |
| `paymentStatus` | `String`                | No       | Enum: `unpaid`, `paid`, `refunded`; default `unpaid`.                                                                    |
| `source`        | `String`                | Yes      | Enum: `online`, `reception`; assigned by the corresponding server-side flow.                                             |
| `notes`         | `String`                | No       | Optional booking notes; apply normal input length and content validation.                                                |

`totalPrice` uses the room's server-side `price` field as its
`pricePerNight`. Compute the number of nights from the normalized stay dates;
clients must not submit or override `totalPrice`, `status`, `paymentStatus`, or
`source` during booking creation. If rates later become date-dependent, the
pricing contract and persistence model must be extended rather than trusting a
client-supplied price.

### Indexes

Create indexes to support room lookups and date-range availability checks:

```js
BookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ guest: 1, createdAt: -1 });
BookingSchema.index({ status: 1, checkInDate: 1 });
```

The room/date indexes narrow candidate bookings for overlap checks; the guest
index supports a guest's booking history, and the status/date index supports
operational lists. MongoDB cannot express arbitrary interval exclusion with a
standard unique index. Therefore, the indexes improve lookup performance but
do not alone prevent concurrent overlapping reservations; booking writes must
also use an appropriate concurrency control strategy.

## 3. API contract

Base path: `/api/v1/bookings`. These endpoints are a proposed contract; no
booking routes are currently mounted. Authentication uses the existing
`verifyToken` conventions: a valid `Authorization: Bearer <token>` header, or
the `token` cookie when the Authorization header is absent. Admin-only
endpoints must use the existing `verifyTokenAndAdmin` authorization rule.
Success and error payloads follow the shared envelopes in [`api.md`](./api.md).

| Method and path                     | Access                   | Purpose                                                                                  |
| ----------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `POST /api/v1/bookings/online`      | Authenticated `User`     | Create an online booking; resolve the guest with `ensureGuestForBookingService(userId)`. |
| `POST /api/v1/bookings/reception`   | `Admin`                  | Create a walk-in or staff-assisted booking.                                              |
| `GET /api/v1/bookings`              | `Admin`                  | List system bookings with pagination and filters.                                        |
| `GET /api/v1/bookings/my-bookings`  | Authenticated `User`     | List bookings belonging to the logged-in user.                                           |
| `GET /api/v1/bookings/:id`          | Booking owner or `Admin` | Return booking details with populated `room` and `guest`.                                |
| `PATCH /api/v1/bookings/:id/status` | `Admin`                  | Apply an allowed booking lifecycle transition.                                           |
| `PATCH /api/v1/bookings/:id/cancel` | Booking owner or `Admin` | Cancel a booking subject to cancellation and payment rules.                              |

The User schema currently supports only `user` and `admin` roles. All
reception and booking-management routes in this contract are therefore
Admin-only; there is no separate receptionist role. Booking-owner access on
the detail and cancellation endpoints requires a booking-specific ownership
check: the existing `verifyTokenAndAuthorization` middleware compares the
route's `:id` directly with the authenticated user's ID and is not sufficient
for a booking ID. Use `verifyToken` plus a check that the booking's Guest is
associated with the authenticated User, while still allowing Admin access.

### Booking creation

The online request body contains booking choices, not identity or trusted
financial/state fields:

```json
{
    "room": "66a1b2c3d4e5f67890123456",
    "checkInDate": "2026-12-10",
    "checkOutDate": "2026-12-13",
    "guestsCount": 2,
    "notes": "Late arrival"
}
```

The server derives `guest` from the authenticated user and sets `source` to
`online`.

The reception request body may identify an eligible existing guest or provide
guest details for a new walk-in profile:

```json
{
    "guest": "66a1b2c3d4e5f67890123457",
    "room": "66a1b2c3d4e5f67890123456",
    "checkInDate": "2026-12-10",
    "checkOutDate": "2026-12-13",
    "guestsCount": 2,
    "notes": "Walk-in"
}
```

In the reception flow, `guest` is required and has two forms:

- A string: the ID of an existing Guest profile.
- An object: a new walk-in guest with `firstName`, `lastName`, and at least one of `email` or `phone` (following the Guest contract rules). The server creates the profile with `user: null`. Any other key inside the `guest` object, including `user`, is rejected with a `400 Bad Request`.

Example of a new walk-in guest request body:

```json
{
    "guest": {
        "firstName": "Sam",
        "lastName": "Taylor",
        "email": "sam@example.com",
        "phone": "01012345678"
    },
    "room": "66a1b2c3d4e5f67890123456",
    "checkInDate": "2026-12-10",
    "checkOutDate": "2026-12-13",
    "guestsCount": 2,
    "notes": "Walk-in"
}
```

The request must not set the booking's `totalPrice`, `status`,
`paymentStatus`, or `source`, or set a guest's `user` reference.

- `201 Created`: booking created and returned in the standard `data` envelope.
- `400 Bad Request`: invalid IDs, malformed dates, or invalid field values.
- `401 Unauthorized` / `403 Forbidden`: caller is unauthenticated or lacks the
  required role.
- `404 Not Found`: referenced room or guest does not exist.
- `409 Conflict`: an active booking overlaps the requested interval or the
  room is marked unavailable (`isAvailable: false`). These conditions must
  have distinct internal error `code` values.
- `422 Unprocessable Entity`: valid request that violates a fixed structural
  rule, such as exceeding the room's capacity.

### List bookings

`GET /api/v1/bookings` is restricted to Admins. Support the existing
pagination contract: `page` defaults to `1`, `limit` defaults to `20`, both
must be positive integers, and `limit` is capped at `100`. Provide filters
for `status`, `source`, `room`, `guest`, and a date range.
Date-range list filters should use the same half-open interval semantics as
availability checks. Return the standard list envelope:

```json
{
    "data": [],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 0,
        "totalPages": 0
    }
}
```

Reject invalid pagination, IDs, statuses, and date ranges with `400 Bad
Request`; do not accept MongoDB operators or raw query fragments as filter
values.

`GET /api/v1/bookings/my-bookings` returns only bookings associated with the
authenticated user's `Guest` profile. Resolve that profile from the
authenticated identity; never use a client-supplied user or guest ID to broaden
the result set. If the user has not yet booked and has no guest profile, return
an empty paginated list without creating a guest as a side effect. Use the
existing pagination bounds and return the shared `{ data, pagination }` shape.

### Booking detail

`GET /api/v1/bookings/:id` returns a booking in `data` with populated room and
guest details. A non-admin owner is authorized only when the booking's guest is
the profile linked to the authenticated user. Return `400 Bad Request` for an
invalid ObjectId, `404 Not Found` for a missing booking, and `403 Forbidden`
when the booking exists but the caller is not its owner or an admin. Do not
expose unrelated guest personal data to unauthorized users.

### Status and cancellation

`PATCH /api/v1/bookings/:id/status` accepts a validated `status` value and
applies only legal lifecycle transitions. At minimum, disallow transitions out
of `cancelled` and allow a booking to move to `checked-in` only when
`today >= checkInDate && today < checkOutDate`, with all dates evaluated as
hotel-local dates in `Africa/Cairo`. The service must validate the current
state and requested transition rather than allowing arbitrary status
assignment.

`PATCH /api/v1/bookings/:id/cancel` is an owner/admin action. The service must
verify ownership, reject cancellation when the booking is already checked in,
checked out, or cancelled, and apply the configured cancellation/payment
policy. If money has already been collected and the applicable policy requires
a refund, update `paymentStatus` to `refunded` only after the refund succeeds;
do not report a successful refund based solely on changing the booking record.
Return the updated booking in `data` on success and `409 Conflict` for a
booking state that cannot be cancelled.

## 4. Core business logic and validations

### Date-range overlap prevention

Represent each stay as a half-open interval: `[checkInDate, checkOutDate)`.
This permits a guest to check out on the same date another booking checks in.
After normalizing and validating the requested dates, find conflicting
bookings for the selected room with:

```js
{
  room: roomId,
  status: { $nin: ['cancelled'] },
  checkInDate: { $lt: requestedCheckOutDate },
  checkOutDate: { $gt: requestedCheckInDate }
}
```

An existing booking overlaps exactly when its check-in is before the requested
check-out and its check-out is after the requested check-in. Exclude cancelled
bookings because they release inventory immediately. Every booking is created
with an initial status of `confirmed`; `confirmed`, `checked-in`, and
`checked-out` are active statuses that hold room inventory. Reject the new
booking with a `409 Conflict` if any matching active booking exists. If the
room is marked unavailable (`isAvailable: false`), also return `409 Conflict`,
using a distinct internal error `code` for that condition.

The availability check and insert must be protected against simultaneous
requests for the same room and overlapping dates. Use a transaction together
with a serialization/locking strategy appropriate to the deployment, or an
equivalent reservation mechanism; a transaction by itself does not necessarily
prevent two concurrent interval queries from both observing no conflict.

### Server-side pricing

Load the selected room from the database and calculate:

```text
nights = (checkOutDate - checkInDate) / one calendar day
totalPrice = nights * room.price
```

Dates must be normalized consistently (for example, to hotel-local stay dates
or UTC date boundaries) so daylight-saving changes do not produce fractional
or incorrect nights. Require a positive whole number of nights. Ignore or
reject any client-supplied price, `totalPrice`, or payment state. Persist the
calculated amount when the booking is created.

### Room status and capacity

Before creating a booking, load the room and verify that it exists, that
`isAvailable` is `true`, and that `guestsCount` is a positive integer no greater
than the room's current `capacity`. A room marked unavailable must not be
booked even if no date-overlapping booking is found; return `409 Conflict`
with its own error `code`. Exceeding capacity is a fixed structural rule and
returns `422 Unprocessable Entity`. Check both room status and date-range
occupancy; neither check replaces the other.

Also validate that both dates are valid, `checkOutDate` is later than
`checkInDate`, referenced ObjectIds are well-formed, and the resolved guest
exists. Return clear validation or conflict errors using the shared API error
envelope. Never trust client-supplied ownership, booking source, status,
payment status, room capacity, room availability, or price.

- **Past-date rule:** `checkInDate` must be today or later. "Today" is evaluated in the hotel's timezone (`Africa/Cairo`), not the server's or UTC. A past `checkInDate` must be rejected with a `400 Bad Request` error.
