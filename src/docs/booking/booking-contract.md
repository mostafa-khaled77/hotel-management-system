# Booking API Contract

- **Module:** Booking
- **Base Path:** `/api/v1/bookings`
- **Status:** Draft — Pending Review
- **Version:** 1.0

---

## 1. Purpose

This document defines the API contract for managing hotel room bookings.

It specifies the available endpoints, request and response schemas, validation rules, HTTP status codes, error responses, and booking business rules.

The contract is implementation-independent. Controllers, services, and database models must follow this contract without exposing internal implementation details to API consumers.

## 2. Scope and Assumptions

The Booking API follows these rules:

1. Each booking is associated with exactly one physical room.
2. A booking is created with the `confirmed` status only after room availability has been successfully verified.
3. A booking must reference an existing guest and an existing room.
4. Guest creation is handled by the existing Guest API, not by the Booking API.
5. The client must create a guest through the Guest API when necessary, then use the resulting guest identifier to create the booking.
6. The room must be available for the requested stay before a booking can be confirmed.
7. The booking price is calculated by the backend and must not be trusted from client input.
8. Booking operations must follow the project's standard response, error, and pagination conventions.

## 3. API Conventions

### 3.1 Base URL

All endpoints are relative to:

`/api/v1/bookings`

### 3.2 Content Type

Requests containing a body must use:

`Content-Type: application/json`

### 3.3 Response Envelopes

Successful single-resource responses use:

```json
{
  "data": {
    "id": "booking_id"
  }
}
```

Collection responses use:

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

Error responses use the project's standard error envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "A human-readable error message"
  }
}
```

The examples above illustrate the response structure. The exact error fields and resource identifier format must remain consistent with the existing API conventions.

## 4. Endpoints Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/bookings` | Create a booking |
| GET | `/api/v1/bookings` | Retrieve bookings |
| GET | `/api/v1/bookings/:id` | Retrieve a booking by ID |
| PATCH | `/api/v1/bookings/:id` | Update permitted booking details |
| PATCH | `/api/v1/bookings/:id/status` | Change booking status |

No hard-delete endpoint is defined in this contract.

## 5. Create Booking

### `POST /api/v1/bookings`

Creates a confirmed booking after validating the request and verifying room availability.

### Request Body

```json
{
  "guestId": "guest_id",
  "roomId": "room_id",
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-13",
  "guestsCount": 2
}
```

### Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `guestId` | String | Yes | Identifier of an existing guest |
| `roomId` | String | Yes | Identifier of the physical room |
| `checkIn` | Date string | Yes | Check-in date |
| `checkOut` | Date string | Yes | Check-out date |
| `guestsCount` | Integer | Yes | Number of guests staying in the room |

The client must not submit `status`, `totalPrice`, or other server-managed fields when creating a booking.

### Successful Response

**HTTP 201 Created**

```json
{
  "data": {
    "id": "booking_id",
    "guestId": "guest_id",
    "roomId": "room_id",
    "checkIn": "2026-11-10",
    "checkOut": "2026-11-13",
    "guestsCount": 2,
    "pricePerNight": 1000,
    "totalPrice": 3000,
    "status": "confirmed",
    "createdAt": "2026-10-19T12:00:00.000Z"
  }
}
```

The response is illustrative. The identifier format, timestamp fields, and exact resource representation must match the existing project conventions.

### Business Rules

1. Validate all required fields and their data types.
2. Verify that `guestId` references an existing guest.
3. Verify that `roomId` references an existing room.
4. Require `checkOut` to be later than `checkIn`.
5. Require `guestsCount` to be a positive integer and not exceed the room's maximum occupancy.
6. Calculate the stay duration using the difference between the check-in and check-out dates.
7. Calculate the total price on the backend using the applicable nightly rate.
8. Reject the booking if the room is unavailable for any part of the requested stay.
9. Set the initial status to `confirmed` only after availability validation succeeds.
10. Prevent concurrent requests from confirming overlapping bookings for the same room.

**Important:** Availability validation and booking creation must be protected against race conditions. A simple availability query followed by an independent insert is not sufficient when two requests can execute concurrently.

### Expected Errors

| HTTP Status | Error Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid input |
| 404 | `GUEST_NOT_FOUND` | Guest does not exist |
| 404 | `ROOM_NOT_FOUND` | Room does not exist |
| 409 | `ROOM_UNAVAILABLE` | Room is unavailable for the requested dates |
| 409 | `BOOKING_CONFLICT` | The request conflicts with an existing booking |

Error codes must be aligned with the project's centralized error-code definitions.

## 6. Retrieve Bookings

### `GET /api/v1/bookings`

Returns a paginated list of bookings.

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | Integer | No | Page number; defaults to `1` |
| `limit` | Integer | No | Number of records per page; defaults to `20`, maximum `100` |

Invalid pagination parameters must follow the project's existing validation behavior.

### Successful Response

**HTTP 200 OK**

```json
{
  "data": [
    {
      "id": "booking_id",
      "guestId": "guest_id",
      "roomId": "room_id",
      "checkIn": "2026-11-10",
      "checkOut": "2026-11-13",
      "guestsCount": 2,
      "totalPrice": 3000,
      "status": "confirmed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

The response must use the existing pagination envelope and conventions.

## 7. Retrieve Booking by ID

### `GET /api/v1/bookings/:id`

Retrieves a single booking using its identifier.

### Successful Response

**HTTP 200 OK**

```json
{
  "data": {
    "id": "booking_id",
    "guestId": "guest_id",
    "roomId": "room_id",
    "checkIn": "2026-11-10",
    "checkOut": "2026-11-13",
    "guestsCount": 2,
    "totalPrice": 3000,
    "status": "confirmed"
  }
}
```

### Expected Errors

- `400 Bad Request` — The booking identifier has an invalid format.
- `404 Not Found` — No booking exists with the supplied identifier.

## 8. Update Booking Details

### `PATCH /api/v1/bookings/:id`

Updates permitted booking details without replacing the entire resource.

### Request Body

```json
{
  "checkIn": "2026-11-11",
  "checkOut": "2026-11-14",
  "guestsCount": 2
}
```

All fields are optional, but at least one permitted field must be provided.

### Rules

1. Reject unknown or immutable fields.
2. Validate the complete resulting booking, not only the supplied fields.
3. If dates change, revalidate room availability before accepting the update.
4. Recalculate the total price on the backend when relevant booking details or the applicable rate change.
5. Do not allow ordinary updates to change the booking status; status changes use the dedicated status endpoint.
6. Do not modify `guestId` or `roomId` through this endpoint unless the project explicitly approves that behavior.
7. Reject modifications that violate the booking's current status or the defined business rules.

### Successful Response

**HTTP 200 OK**

```json
{
  "data": {
    "id": "booking_id",
    "guestId": "guest_id",
    "roomId": "room_id",
    "checkIn": "2026-11-11",
    "checkOut": "2026-11-14",
    "guestsCount": 2,
    "totalPrice": 3000,
    "status": "confirmed"
  }
}
```

### Expected Errors

- `400 Bad Request` — Invalid update payload.
- `404 Not Found` — Booking does not exist.
- `409 Conflict` — Updated dates conflict with another booking or violate a business rule.

## 9. Update Booking Status

### `PATCH /api/v1/bookings/:id/status`

Changes the status of an existing booking according to the permitted state transitions.

### Request Body

```json
{
  "status": "cancelled"
}
```

The client may request a status change, but the server is responsible for validating whether the transition is allowed.

### Initial Status

New bookings start as `confirmed` after successful availability validation.

### Proposed Status Values

- `confirmed`
- `checked_in`
- `checked_out`
- `cancelled`
- `no_show`

These values are a proposal pending confirmation against the project's existing domain model and operational requirements.

### Status Transition Rules

Status transitions must be explicitly defined before implementation. For example:

- `confirmed` → `checked_in`
- `confirmed` → `cancelled`
- `confirmed` → `no_show`
- `checked_in` → `checked_out`

Invalid transitions must be rejected. A cancelled booking must not be reactivated implicitly by an ordinary update.

Cancellation policy, check-in timing, and the handling of `no_show` must be finalized before these transitions are treated as authoritative.

### Successful Response

**HTTP 200 OK**

```json
{
  "data": {
    "id": "booking_id",
    "status": "cancelled"
  }
}
```

### Expected Errors

- `400 Bad Request` — Invalid status value.
- `404 Not Found` — Booking does not exist.
- `409 Conflict` — Requested status transition is not permitted.

## 10. Date and Availability Rules

### Date Format

Check-in and check-out dates use the ISO 8601 calendar-date format:

`YYYY-MM-DD`

Example:

```json
{
  "checkIn": "2026-11-10",
  "checkOut": "2026-11-13"
}
```

The example represents three nights.

### Stay Duration

The stay duration is calculated as:

`checkOut - checkIn`

The check-in date is inclusive, and the check-out date is exclusive.

A booking from November 10 to November 13 therefore occupies the nights of November 10, 11, and 12.

### Overlap Rule

For a room to be available, an existing blocking booking must not overlap the requested stay.

For date-only intervals, two bookings overlap when:

`existing.checkIn < requested.checkOut`

and

`existing.checkOut > requested.checkIn`

This allows one guest to check out on the same date another guest checks in, assuming the hotel's operational rules permit it.

Only statuses designated as blocking room availability should participate in the overlap check. The final blocking-status set must match the approved booking lifecycle.

## 11. Pricing Rules

The backend is the source of truth for booking prices.

The total price is calculated as:

`totalPrice = nights × applicablePricePerNight`

For example:

- Check-in: November 10
- Check-out: November 13
- Nights: 3
- Nightly rate: 1,000
- Total price: 3,000

The client must not be allowed to override the calculated total.

The pricing policy must specify whether the nightly rate is captured at booking creation or recalculated from the room's current rate during later updates. A booking should not be repriced unexpectedly merely because the room's current rate changes.

Taxes, discounts, deposits, and additional charges are outside this contract until explicitly defined.

## 12. Guest Creation Flow

Guest creation remains the responsibility of the existing Guest API.

### When the Guest Already Exists

1. Obtain the existing guest identifier.
2. Submit `POST /api/v1/bookings` with that `guestId`.
3. The Booking API validates the guest reference and processes the booking.

### When the Guest Does Not Exist

1. Submit the guest details to the existing Guest API.
2. Receive the newly created guest identifier.
3. Submit `POST /api/v1/bookings` using that identifier.
4. The Booking API validates the reference and processes the booking.

The Booking API does not create guests implicitly from guest details in the booking request.

If guest creation succeeds but booking creation fails, the guest may remain in the system. This behavior must be understood by API consumers; automatic rollback across both operations is not guaranteed by this contract.

## 13. Error Handling

All endpoints must use the project's standard error-response envelope.

Expected HTTP status categories:

| Status | Meaning |
|---|---|
| `200 OK` | Successful read or update |
| `201 Created` | Booking created successfully |
| `400 Bad Request` | Invalid request or validation failure |
| `401 Unauthorized` | Authentication is required or invalid |
| `403 Forbidden` | Authenticated caller lacks permission |
| `404 Not Found` | Requested resource does not exist |
| `409 Conflict` | Availability conflict or invalid state transition |
| `500 Internal Server Error` | Unexpected server failure |

Authentication and authorization requirements must follow the project's existing access-control policy. This document does not assume that every booking endpoint is public.

Internal stack traces, database errors, and other implementation details must not be exposed in API responses.

## 14. Contract Invariants

The following invariants must always hold:

1. Every booking references exactly one existing guest and one existing room.
2. Every booking has a valid, positive stay duration.
3. Every confirmed booking satisfies the room-availability rules.
4. The server calculates and controls the booking price.
5. The initial status is `confirmed` only after availability validation succeeds.
6. Invalid status transitions are rejected.
7. Booking creation must not permit overlapping confirmed stays for the same physical room.
8. Successful responses and errors follow the project's shared API conventions.
9. Booking operations must not bypass validation by relying exclusively on frontend checks.

## 15. Decisions Pending Review

The following decisions must be confirmed before the contract is considered final:

- [ ] Final booking status enum and allowed transitions.
- [ ] Which booking statuses block room availability.
- [ ] Whether cancellation is allowed after check-in or after a specified deadline.
- [ ] Whether