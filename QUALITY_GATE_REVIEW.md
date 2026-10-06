# Quality Gate Review

## Finding 1: Reliability / Accuracy (Overlapping Booking Validation)
- **What was found:** Initial logic needed precise boundaries to prevent double-booking the same equipment.
- **How it was fixed:** Applied SQL window check `start_at < newEnd AND end_at > newStart` with parameter binding.
- **Evidence:** Verified via `curl` with overlapping time ranges (`10:00 - 12:00` against existing `09:00 - 11:00`), returning `HTTP 409 Conflict`.

## Finding 2: Security (SQL Injection Prevention)
- **What was found:** Checked query execution across all CRUD endpoints to avoid raw string concatenation.
- **How it was fixed:** Used `db.prepare(...).run(...)` and `.get(...)` with positional parameter arrays (`?`).
- **Evidence:** Manual code audit confirmed no user input is concatenated into raw SQL strings.

## Finding 3: Reasoning / Ownership (Patch Overlap Conflict Fix)
- **What was found:** Updating a booking without changing dates could falsely trigger an overlap conflict with itself.
- **How it was fixed:** Extended validation query with `AND id != ?` when checking existing records during `PATCH`.
- **Evidence:** Verified PATCH operation updates non-time fields cleanly with `200 OK`.