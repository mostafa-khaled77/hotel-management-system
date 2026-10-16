# Booking API Contract

- **Document:** `src/docs/booking.md`
- **Module:** Booking
- **Base path:** `/api/v1/bookings`
- **Status:** Planned; no booking or guest model, controller, or route is currently
- registered in the application.

This document defines the behavior to implement for room reservations. It
follows the project's JSON response and error envelopes in
[`api.md`](./api.md), and its pagination defaults. A guest module is also
required before bookings can be created because each booking references a
guest.

## Booking object

Example response object:

```json
{
  "id": "66a1b2c3d4e5f67890123456",
  "guestId": "66a1b2c3d4e5f67890123457",
  "roomId": "66a1b2c3d4e5f67890123458",
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-13",
  "guestsCount": 2,
  "status": "confirmed",
  "pricePerNight": 150,
  "totalPrice": 450,
  "createdAt": "2026-10-14T18:00:00.000Z",
  "updatedAt": "2026-10-14T18:00:00.000Z"
}
```

| Field | Rules |
| --- | --- |
| `id` | MongoDB document ID serialized as a string. |
| `guestId` | ID of an existing guest; returned as a string, not a populated object. |
| `roomId` | ID of an existing room; returned as a string, not a populated object. |
| `checkIn` | Required date-only string in strict `YYYY-MM-DD` format. |
| `checkOut` | Required date-only string in strict `YYYY-MM-DD` format, later than `checkIn`. |
| `guestsCount` | Positive integer no greater than the room's `capacity`. |
| `status` | Server-managed booking status; clients cannot set it on create or date update. |
| `pricePerNight` | Server-captured snapshot of the room's price when booked. |
| `totalPrice` | Server-calculated as number of nights multiplied by `pricePerNight`. |
| `createdAt`, `updatedAt` | Server-managed timestamps. |

Clients must not submit `id`, `_id`, `__v`, timestamps, `status`,
`pricePerNight`, or `totalPrice` when creating or updating a booking. The
booking's price fields use the same numeric unit as `room.price`; the project
does not currently define a currency.

## Status lifecycle

Supported statuses are:

- `confirmed` — reservation accepted.
- `checkedIn` — guest has checked in.
- `checkedOut` — stay has ended.
- `cancelled` — reservation cancelled before check-in.

Only these transitions are allowed:

| Current status | Allowed next status |
| --- | --- |
| `confirmed` | `checkedIn`, `cancelled` |
| `checkedIn` | `checkedOut` |
| `checkedOut` | None |
| `cancelled` | None |

Only `confirmed` and `checkedIn` bookings block room availability. Invalid
transitions return `409 Conflict` with `INVALID_STATUS_TRANSITION`. A booking's
dates and guest count may only be changed while it is `confirmed`.

## Endpoints

### Create a booking

`POST /api/v1/bookings`

Request body:

```json
{
  "guestId": "66a1b2c3d4e5f67890123457",
  "roomId": "66a1b2c3d4e5f67890123458",
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-13",
  "guestsCount": 2
}
```

The server must verify that:

1. Both IDs are valid MongoDB ObjectIds and the guest and room exist.
2. The dates are valid calendar dates, `checkOut` is later than `checkIn`, and
   `checkIn` is not before today's UTC calendar date.
3. `guestsCount` is a positive integer no greater than the room's capacity.
4. No confirmed or checked-in booking for the room overlaps the requested stay.

The server captures the room's current `price` as `pricePerNight`, calculates
`totalPrice`, sets status to `confirmed`, and returns `201 Created`:

```json
{
  "data": {
    "id": "66a1b2c3d4e5f67890123456",
    "guestId": "66a1b2c3d4e5f67890123457",
    "roomId": "66a1b2c3d4e5f67890123458",
    "checkIn": "2026-11-10",
    "checkOut": "2026-11-13",
    "guestsCount": 2,
    "status": "confirmed",
    "pricePerNight": 150,
    "totalPrice": 450,
    "createdAt": "2026-10-14T18:00:00.000Z",
    "updatedAt": "2026-10-14T18:00:00.000Z"
  }
}
```

- `400 Bad Request`: malformed ID or invalid input.
- `404 Not Found`: guest or room does not exist.
- `409 Conflict`: dates overlap an active booking for the room.

### List bookings

`GET /api/v1/bookings`

Optional query parameters:

| Parameter | Rules |
| --- | --- |
| `page` | Positive integer; defaults to `1`. |
| `limit` | Positive integer; defaults to `20`, capped at `100` as in the shared pagination utility. |
| `guestId` | Filter by guest ObjectId. |
| `roomId` | Filter by room ObjectId. |
| `status` | Exact match for one of the supported statuses. |
| `checkIn` | Exact match on the check-in date (`YYYY-MM-DD`). |
| `checkOut` | Exact match on the check-out date (`YYYY-MM-DD`). |

Invalid query values return `400 Bad Request`. Results are ordered by
`createdAt` descending, then by ID descending for stable pagination.

`200 OK` response:

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

When there are no matching records, return an empty `data` array and
`totalPages: 0`.

### Get a booking

`GET /api/v1/bookings/:id`

- `200 OK`: return the booking in the shared `{ "data": { ... } }` envelope.
- `400 Bad Request`: `:id` is not a valid MongoDB ObjectId.
- `404 Not Found`: no booking exists with that ID.

### Update booking dates or guest count

`PATCH /api/v1/bookings/:id`

Only `checkIn`, `checkOut`, and `guestsCount` may be supplied. The body must
contain at least one of these fields; `guestId` and `roomId` cannot be changed.
The resulting dates and guest count must satisfy the creation rules. Updates
are allowed only while the booking is `confirmed`; the current booking must be
excluded from the overlap check. Recalculate `totalPrice` using the booking's
original `pricePerNight` snapshot.

- `200 OK`: return the updated booking in the shared `data` envelope.
- `400 Bad Request`: invalid ID, empty body, or invalid field values.
- `404 Not Found`: no booking exists with that ID.
- `409 Conflict`: booking is not confirmed or the new dates conflict.

### Change booking status

`PATCH /api/v1/bookings/:id/status`

Request body:

```json
{
  "status": "checkedIn"
}
```

Only `status` is accepted, with a value from the supported statuses. The
requested transition must be allowed by the lifecycle table.

- `200 OK`: return the updated booking in the shared `data` envelope.
- `400 Bad Request`: invalid ID or unsupported status value.
- `404 Not Found`: no booking exists with that ID.
- `409 Conflict`: transition is not allowed.

### Delete a booking

Bookings are reservation history and must not be deleted through the API.
Use the status endpoint to cancel an eligible booking. No `DELETE` endpoint is
defined.

## Date and availability rules

Dates are date-only values (`YYYY-MM-DD`) interpreted as UTC calendar dates, not
local timestamps. Reject impossible dates and any value that does not exactly
match the required format.

A stay occupies the half-open interval `[checkIn, checkOut)`: check-in is
included and check-out is excluded. Therefore, a booking that checks out on the
same date another checks in does not conflict. Two stays overlap when:

```text
existing.checkIn < requested.checkOut
AND existing.checkOut > requested.checkIn
```

Only `confirmed` and `checkedIn` bookings participate in this conflict check.
The room's `isAvailable` field is not date-based availability; it must not be
used in place of the booking conflict query.

The initial implementation must check for conflicts before saving. A
check-then-save query by itself is not safe against simultaneous requests, so
preventing concurrent double bookings requires an explicit concurrency strategy
before the API is relied on for production reservations.

## Pricing rules

At booking creation:

```text
nights = checkOut - checkIn
pricePerNight = room.price
totalPrice = nights * pricePerNight
```

Existing bookings retain their captured `pricePerNight` if the room price
changes. If dates are updated, `totalPrice` is recalculated from the original
snapshot rather than the room's current price. Clients cannot supply or alter
either price field.

## Error responses

Errors use the project's standard envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "checkOut",
        "message": "Must be later than checkIn."
      }
    ]
  }
}
```

Use the existing codes `VALIDATION_ERROR`, `INVALID_ID`, and `NOT_FOUND` for
their corresponding `400` and `404` responses. Add `BOOKING_CONFLICT` and
`INVALID_STATUS_TRANSITION` to `src/constants/errorCodes.js` before returning
them for `409 Conflict`. Unexpected failures must continue to use the existing
`INTERNAL_SERVER_ERROR` behavior; do not return raw database errors or stack
traces.

## Implementation order and project fit

1. Implement the guest model and API so booking references can be validated.
2. Add a booking model with timestamps, references, enums, and schema
   validation.
3. Implement booking controllers and routes, ObjectId validation, pagination,
   conflict detection, and the status transition rules.
4. Register `/api/v1/bookings` in `src/app.js` and add focused tests for date
   boundaries, overlap, capacity, pricing snapshots, and status transitions.

The current application registers only `/api/v1/rooms`; none of the booking
endpoints above should be treated as available until implemented and registered.
The project currently has no authentication middleware, so authorization for
booking and guest data must be addressed before exposing these endpoints to
untrusted clients.
