# API Contract

Base URL: `http://localhost:8787/api`

## Endpoints

### Equipment
- `GET /equipment`: List all available equipment (`200 OK`).

### Bookings
- `GET /bookings`: List all bookings (`200 OK`).
- `GET /bookings/:id`: Retrieve single booking (`200 OK` or `404 Not Found`).
- `POST /bookings`: Create a new booking (`201 Created`, `400 Bad Request`, `409 Conflict`).
- `PATCH /bookings/:id`: Update existing booking (`200 OK`, `400 Bad Request`, `404 Not Found`, `409 Conflict`).
- `DELETE /bookings/:id`: Delete a booking (`204 No Content` or `404 Not Found`).