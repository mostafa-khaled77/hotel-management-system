# Booking Contract — Implemented Behavior

This document describes the Booking behavior currently implemented in the
repository. It is not a proposal for endpoints or behavior that do not yet
exist.

## Scope and endpoint

The app mounts `src/routes/booking.js` at `/api/v1/bookings`. The only active
booking route is:

| Method | Path | Access | Success |
| --- | --- | --- | --- |
| `POST` | `/api/v1/bookings/online` | Any caller with a valid JWT | `201 Created` |

Authentication uses `verifyToken`. It accepts a Bearer token in the
`Authorization` header or the `token` cookie when the Authorization header is
absent. The route does not restrict the caller to a particular role. The
controller obtains the User ID from `req.user.id`; the client does not choose
the Guest or User association.

No query or path parameters are used. `src/routes/bookings.js` is not mounted
and does not implement additional booking operations. Although the model
exports `validateReceptionBooking` and `validateBookingStatusUpdate`, there is
no active reception, list, detail, status-update, or cancellation endpoint.

## Request and validation

Example request:

```http
POST /api/v1/bookings/online
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "room": "66a1b2c3d4e5f67890123456",
  "checkInDate": "2027-01-15",
  "checkOutDate": "2027-01-18",
  "guestsCount": 1,
  "notes": "Late arrival"
}
```

The Joi online-booking schema accepts only these fields:

| Field | Rule |
| --- | --- |
| `room` | Required string. Joi does not validate its ObjectId format. |
| `checkInDate` | Required exact `YYYY-MM-DD` string; must be a real calendar date. |
| `checkOutDate` | Required exact `YYYY-MM-DD` string; must be later than check-in. |
| `guestsCount` | Required integer, minimum `1`. |
| `notes` | Optional trimmed string. |

Unknown fields are rejected by Joi. The client cannot set `guest`, `source`,
`status`, `paymentStatus`, `pricePerNight`, or `totalPrice`. An empty `notes`
string is not accepted by the current Joi string rule.

Both date strings are parsed as UTC midnight after a calendar-date round trip
check. The service rejects a check-in date earlier than the current
`Africa/Cairo` calendar date with `400 BAD_REQUEST`. `todayInHotel` is computed
when the date utility module is loaded, not on each request; a long-running
process can therefore retain a stale value after Cairo midnight.

Because `room` is checked only as a string by Joi and the route has no
ObjectId-validation middleware, a well-formed but nonexistent Room returns
`404 NOT_FOUND`; a malformed ObjectId can become an unhandled Mongoose cast
error and use the generic error handling path.

## Online booking flow

The implemented flow is:

1. `verifyToken` verifies the JWT and sets `req.user`; the controller passes
   `req.user.id` and the request body to the booking service.
2. The service validates the body and rejects past check-in dates before
   opening a session.
3. It computes the number of nights from the UTC-midnight date values.
4. It starts a Mongoose session and runs the database work inside
   `session.withTransaction()`.
5. It loads the Room in the session and explicitly selects
   `bookingVersion`, which is otherwise excluded by the Room schema.
6. It rejects a missing Room, `isAvailable: false`, or guest count above
   capacity.
7. It conditionally increments `bookingVersion`, using the value read in step
   5 as part of the update filter.
8. It checks for a date-overlapping Booking in the same session.
9. It resolves the authenticated User's Guest profile in the same session.
10. It creates the Booking in the same session. Successful completion commits
    the transaction; an error aborts it. The session is ended in a `finally`
    block.

The User-to-Guest resolver first searches for a Guest whose `user` equals the
authenticated User ID and reuses that Guest without refreshing its details. If
none exists, it loads the User's `firstName`, `lastName`, `email`, and `phone`.
A missing User produces `404 NOT_FOUND`. The resolver rejects missing or blank
names with `400 BAD_REQUEST`; however, the User schema defaults absent names
to `Google` and `User`, so a hydrated User may supply those placeholders and
pass this check. Otherwise, the resolver creates a linked Guest using the
names and email, and the User phone or an empty string. The Guest create and
lookup use the booking session.

The Guest schema declares unique sparse indexes for `user` and `email`.
Duplicate-key errors during Guest creation propagate as `409 DUPLICATE_KEY`;
the booking service does not recover by reloading a Guest after such an error.
Whether those indexes exist in a particular database is not verified here.
The `user` field also defaults to `null`; because a sparse index includes
documents where the indexed field exists with a `null` value, multiple
unlinked Guest documents may conflict if this unique index is active. That
affects unlinked Guest creation, not the normal online path that assigns a
User ID.

## Room availability and concurrent requests

The Room schema declares `bookingVersion` as a Number with default `0` and
`select: false`. The online booking service explicitly selects it and performs
this compare-and-increment update in the transaction:

```js
{
  _id: room._id,
  bookingVersion: room.bookingVersion,
  isAvailable: true
}
```

The update increments `bookingVersion`. If it returns no Room, the service
throws `409 CONFLICT` with the message “Room availability has changed. Please
try again.” The version is updated transactionally, so a later error in the
same transaction does not commit that increment.

The version is per Room: requests targeting the same Room contend on its
versioned document; different Rooms do not share this version check and can
run concurrently unless they contend on another shared resource. For example,
simultaneous first bookings by the same User can contend on the unique Guest
association. The service has no custom retry loop or retry count. Transaction
retries and uncertain commit retries are delegated to the MongoDB driver's
`withTransaction()` implementation. Application-level conflicts such as the
explicit version-update error or an overlap error are thrown as `AppError`s
and are not retried by application code.

MongoDB transactions require a transaction-capable deployment, such as a
replica set or `mongos`. The connection code does not configure a transaction
fallback. If an existing Room document lacks a stored `bookingVersion`, a
hydrated Mongoose default does not itself populate that field in MongoDB; the
conditional database update may therefore fail to match `bookingVersion: 0`
and return the version-conflict response. Rooms inserted through the current
Mongoose seeder receive the schema default unless defaults are bypassed.

## Overlap, dates, and capacity

The service rejects a room marked unavailable before checking existing
Bookings. It then searches for a Booking with the same Room and a status other
than `cancelled`, using:

```js
{
  room: roomId,
  status: { $ne: "cancelled" },
  checkInDate: { $lt: requestedCheckOutDate },
  checkOutDate: { $gt: requestedCheckInDate }
}
```

This is half-open interval overlap behavior: adjacent stays are allowed when
one booking checks out on the date another checks in. Every status other than
`cancelled` participates in the query, including `confirmed`, `checked-in`,
and `checked-out`. The application currently creates new bookings as
`confirmed`; no active endpoint changes a Booking's status.

`room.isAvailable` is checked but is not changed by booking creation. The
version increment does not mark the Room unavailable. Date-specific occupancy
is checked from existing Booking records.

`guestsCount` must be a positive integer in Joi and cannot exceed
`room.capacity`; excess capacity currently returns `400 BAD_REQUEST`, not
`422`.

The service computes:

```text
nights = (checkOutDate - checkInDate) / 86,400,000
totalPrice = nights * room.price
```

Since both accepted date values are UTC midnight and check-out must be later,
the current calculation yields a positive whole number of nights. Check-in
validation compares the requested date string with the date in `Africa/Cairo`;
the stored dates and overlap comparisons are JavaScript `Date` values parsed
from UTC-midnight strings.

## Booking fields, pricing, and payment

The Mongoose Booking schema contains:

| Field | Behavior |
| --- | --- |
| `guest` | Required ObjectId reference to Guest. Set by the server. |
| `room` | Required ObjectId reference to Room. Set from the validated request. |
| `checkInDate`, `checkOutDate` | Required Dates; schema also requires check-out later than check-in. |
| `guestsCount` | Required integer, minimum `1`. |
| `pricePerNight` | Required, non-negative snapshot of the Room's current `price`. |
| `totalPrice` | Required, non-negative server calculation: nights times `pricePerNight`. |
| `status` | Enum `confirmed`, `checked-in`, `checked-out`, `cancelled`; defaults to `confirmed`. |
| `paymentStatus` | Enum `unpaid`, `paid`, `refunded`; defaults to `unpaid`. |
| `source` | Required enum `online` or `reception`; this endpoint sets `online`. |
| `notes` | Optional trimmed string. |

The schema also enables Mongoose `createdAt` and `updatedAt` timestamps.

The client cannot submit or override the Guest, source, status, payment status,
or prices. No payment processor or payment/status management endpoint is
implemented. New bookings retain the schema defaults `confirmed` and `unpaid`.
The `reception` source value and status values other than the default remain
schema-level values, not active API flows.

The schema declares these non-unique indexes:

```js
{ room: 1, checkInDate: 1, checkOutDate: 1 }
{ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 }
{ guest: 1, createdAt: -1 }
{ status: 1, checkInDate: 1 }
```

These are schema declarations; this documentation does not verify whether the
indexes have been created in a particular MongoDB database.

## Responses and errors

On success, the controller returns `201 Created` through the standard
`{ "data": ... }` response envelope. The Booking JSON transform exposes `id`
and removes `_id` and `__v`. Neither Room nor Guest is populated, so `room` and
`guest` are returned as IDs.

The current response includes the created Booking's IDs, dates, guest count,
price snapshot, total, status, payment status, source, timestamps, and `notes`
when present. Example:

```json
{
  "data": {
    "id": "66a1b2c3d4e5f67890123456",
    "guest": "66a1b2c3d4e5f67890123457",
    "room": "66a1b2c3d4e5f67890123458",
    "checkInDate": "2027-01-15T00:00:00.000Z",
    "checkOutDate": "2027-01-18T00:00:00.000Z",
    "guestsCount": 1,
    "pricePerNight": 100,
    "totalPrice": 300,
    "status": "confirmed",
    "paymentStatus": "unpaid",
    "source": "online",
    "createdAt": "2026-11-23T12:00:00.000Z",
    "updatedAt": "2026-11-23T12:00:00.000Z"
  }
}
```

Known error handling:

| HTTP status | Error code | Current cases |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Joi body/date validation errors; response includes Joi field details. |
| `400` | `BAD_REQUEST` | Past check-in, excess room capacity, or missing/blank User names for Guest creation. |
| `401` | `UNAUTHORIZED` | Missing or invalid JWT. |
| `404` | `NOT_FOUND` | Room or authenticated User does not exist. |
| `409` | `CONFLICT` | Room is unavailable, the versioned Room update matches no document, or a non-cancelled Booking overlaps. |
| `409` | `DUPLICATE_KEY` | MongoDB duplicate-key error, such as a conflicting Guest unique value. |
| `500` | Generic/underlying error code | Unhandled cast, validation, transaction, or database errors. These are not mapped to booking-specific codes. |

Errors use `{ "error": { "code": ..., "message": ..., "details": [...] } }`.
The shared error handler returns a generic message for errors without an
application status/value, and maps MongoDB duplicate-key errors to
`DUPLICATE_KEY`.

## Implementation boundaries and caveats

- Only online booking creation is an active Booking API. Reception validation
  exists in the model but is not wired to a route or service flow.
- There are no Booking list, detail, owner-history, status, or cancellation
  endpoints.
- `bookingVersion` provides a per-Room conditional write inside the
  transaction; no separate interval-exclusion index or application retry loop
  is implemented.
- `todayInHotel` is captured at module load, so a server kept running across
  Cairo midnight may compare against the previous day's value.
- A malformed ObjectId string for `room` is not rejected by Joi or route
  middleware and can surface as a generic server error.
