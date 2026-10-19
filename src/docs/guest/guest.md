# Guest API Contract

This is a proposed contract for the next module. It follows the shared response
conventions in [`api.md`](./api.md) and the resource conventions in
[`room.md`](./room.md). The guest module should come before bookings so each
reservation can refer to a stable guest record instead of duplicating contact
details.

## Endpoint index

- [List guests](#list-guests) — `GET /api/v1/guests`
- [Create a guest](#create-a-guest) — `POST /api/v1/guests`
- [Get a guest](#get-a-guest) — `GET /api/v1/guests/:id`
- [Update a guest](#update-a-guest) — `PATCH /api/v1/guests/:id`
- [Delete a guest](#delete-a-guest) — `DELETE /api/v1/guests/:id`

## Base URL

`/api/v1/guests`

## Guest object

Example response object:

```json
{
  "id": "66a1b2c3d4e5f67890123456",
  "firstName": "Sam",
  "lastName": "Taylor",
  "email": "sam.taylor@example.com",
  "phone": "+15551234567",
  "createdAt": "2026-10-11T10:00:00.000Z",
  "updatedAt": "2026-10-11T10:00:00.000Z"
}
```

`id` is the MongoDB document ID serialized in place of `_id`. `createdAt` and
`updatedAt` are set by Mongoose timestamps. Clients must not send `id`, `_id`,
`createdAt`, or `updatedAt` in create or update bodies.

| Field | Proposed rules |
| --- | --- |
| `firstName` | Required non-empty string; trim surrounding whitespace. |
| `lastName` | Required non-empty string; trim surrounding whitespace. |
| `email` | Optional valid email; normalize surrounding whitespace and case. |
| `phone` | Optional non-empty string; normalize surrounding whitespace. |

At least one of `email` or `phone` must be provided on creation. This gives
staff a way to contact a guest without requiring both contact methods.

Email should be unique when supplied, using a normalized, case-insensitive
comparison. Phone is not unique by default because family members or shared
contacts may use the same number. A duplicate email returns `409 Conflict`.

## Endpoints

### List guests

`GET /api/v1/guests`

Optional query parameters:

| Parameter | Rules |
| --- | --- |
| `search` | Case-insensitive partial match on first name, last name, email, or phone. |
| `page` | 1-based page number; defaults to `1`. |
| `limit` | Results per page; defaults to `20`, maximum `100`. |
| `sort` | `firstName`, `lastName`, or `createdAt`; prefix with `-` for descending. Defaults to `lastName`, then `firstName`. |

Example request:
`GET /api/v1/guests?search=sam&page=1&limit=20&sort=lastName`

`200 OK` response:

```json
{
  "data": [
    {
      "id": "66a1b2c3d4e5f67890123456",
      "firstName": "Sam",
      "lastName": "Taylor",
      "email": "sam.taylor@example.com",
      "phone": "+15551234567",
      "createdAt": "2026-10-11T10:00:00.000Z",
      "updatedAt": "2026-10-11T10:00:00.000Z"
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

Invalid pagination parameters return `400 Bad Request`. The search parameter
should be treated as literal text, not as a client-provided database query or
regular expression.

### Create a guest

`POST /api/v1/guests`

Request body:

```json
{
  "firstName": "Sam",
  "lastName": "Taylor",
  "email": "sam.taylor@example.com",
  "phone": "+15551234567"
}
```

`firstName` and `lastName` are required. At least one of `email` or `phone` is
required; both may be provided.

`201 Created` response:

```json
{
  "data": {
    "id": "66a1b2c3d4e5f67890123456",
    "firstName": "Sam",
    "lastName": "Taylor",
    "email": "sam.taylor@example.com",
    "phone": "+15551234567",
    "createdAt": "2026-10-11T10:00:00.000Z",
    "updatedAt": "2026-10-11T10:00:00.000Z"
  }
}
```

- `400 Bad Request`: invalid fields or no contact method was provided.
- `409 Conflict`: another guest already uses the normalized email address.

### Get a guest

`GET /api/v1/guests/:id`

`:id` is the MongoDB document ID.

`200 OK` response:

```json
{
  "data": {
    "id": "66a1b2c3d4e5f67890123456",
    "firstName": "Sam",
    "lastName": "Taylor",
    "email": "sam.taylor@example.com",
    "phone": "+15551234567",
    "createdAt": "2026-10-11T10:00:00.000Z",
    "updatedAt": "2026-10-11T10:00:00.000Z"
  }
}
```

- `400 Bad Request`: `:id` is not a valid MongoDB ObjectId.
- `404 Not Found`: no guest exists with that ID.

### Update a guest

`PATCH /api/v1/guests/:id`

The request body is a partial guest object; omitted fields remain unchanged.
Only `firstName`, `lastName`, `email`, and `phone` may be updated. The resulting
guest record must still have at least one of `email` or `phone`.

Request body:

```json
{
  "phone": "+15559876543"
}
```

`200 OK` returns the updated guest in the shared `data` envelope.

- `400 Bad Request`: invalid ID or field values, an empty body, or an update
  that would leave the guest without both contact methods.
- `404 Not Found`: no guest exists with that ID.
- `409 Conflict`: the updated email is already assigned to another guest.

### Delete a guest

`DELETE /api/v1/guests/:id`

- `204 No Content`: guest deleted successfully; response has no body.
- `400 Bad Request`: `:id` is not a valid MongoDB ObjectId.
- `404 Not Found`: no guest exists with that ID.
- `409 Conflict`: guest has an associated booking and cannot be deleted.

The booking conflict rule applies once the booking module exists. Preserve guest
records referenced by booking history; do not silently cascade-delete bookings.
If future retention requirements call for removing personal information, define
a separate anonymization/retention policy rather than erasing booking history.

## Error response

Use the shared error envelope from [`api.md`](./api.md). Error codes should
remain stable for clients. For example, invalid input uses
`VALIDATION_ERROR`, missing guests use `NOT_FOUND`, and duplicate email or
booking-reference conflicts use `DUPLICATE_KEY` or a dedicated conflict code.

## Data handling

Guest email addresses and phone numbers are personal data. Return them only from
guest endpoints to authorized callers, avoid logging request bodies or contact
details, and do not include these fields in unrelated room responses. The
current room routes are public; authentication and authorization policy for
guest endpoints should be decided before exposing real guest data.

## Proposed scope and follow-up

This contract covers guest profile CRUD and paginated search. It does not cover
authentication, guest self-service, identity verification, payments, or booking
operations. Booking endpoints should reference `guestId` and `roomId` and define
date-based availability separately; a room's `isAvailable` flag alone cannot
represent availability over a stay date range.
