# Booking Module

The current Booking API exposes one implemented operation:
`POST /api/v1/bookings/online`. It requires authentication and creates a booking
for the authenticated user. Reception booking, booking lookup/listing, and
booking status or cancellation endpoints are not currently exposed.

See the [implemented Booking contract](./booking-contract.md) for the exact
request, validation, transaction, concurrency, date, pricing, response, and
error behavior.

The module associates a `Room` and a `Guest` for a date range. It checks both
the room's operational `isAvailable` flag and overlapping non-cancelled
bookings. Online Guest profiles are resolved or created from the authenticated
User as part of the booking transaction.
