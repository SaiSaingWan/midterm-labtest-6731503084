# AI Log

## Prompts and Assistance
1. **Prompt:** "Help design and implement the Campus Equipment Booking API using Hono, TypeScript, and SQLite."
   - **Used:** Used the full boilerplate structure for endpoints (`/api/equipment`, `/api/bookings`) and SQLite schema.
   - **Verified:** Checked parameter bindings (`?`) to prevent SQL injection and verified date comparison logic.

2. **Prompt:** "How to validate non-overlapping booking slots in SQLite?"
   - **Used:** Implemented time comparison logic `start_at < endAt AND end_at > startAt`.
   - **Verified:** Tested via cURL with overlapping time ranges and confirmed HTTP `409 Conflict` response.