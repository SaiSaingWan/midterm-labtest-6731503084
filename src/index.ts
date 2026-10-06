import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { db } from './db';
import { randomUUID } from 'node:crypto';

const app = new Hono();

// GET /api/equipment
app.get('/api/equipment', (c) => {
  const equipment = db.prepare('SELECT id, name, location FROM equipment').all();
  return c.json(equipment, 200);
});

// GET /api/bookings
app.get('/api/bookings', (c) => {
  const bookings = db.prepare(`
    SELECT id, equipment_id AS equipmentId, borrower_name AS borrowerName, 
           start_at AS startAt, end_at AS endAt, purpose 
    FROM bookings
  `).all();
  return c.json(bookings, 200);
});

// GET /api/bookings/:id
app.get('/api/bookings/:id', (c) => {
  const id = c.req.param('id');
  const booking = db.prepare(`
    SELECT id, equipment_id AS equipmentId, borrower_name AS borrowerName, 
           start_at AS startAt, end_at AS endAt, purpose 
    FROM bookings WHERE id = ?
  `).get(id);

  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404);
  }
  return c.json(booking, 200);
});

// Helper validation function
function validateAndCheckOverlap(data: any, currentBookingId: string | null = null) {
  const { equipmentId, borrowerName, startAt, endAt, purpose } = data;

  if (!equipmentId || !borrowerName || !startAt || !endAt || !purpose) {
    return { status: 400, error: 'Missing required fields' };
  }

  if (new Date(startAt) >= new Date(endAt)) {
    return { status: 400, error: 'startAt must be before endAt' };
  }

  const equipmentExists = db.prepare('SELECT id FROM equipment WHERE id = ?').get(equipmentId);
  if (!equipmentExists) {
    return { status: 400, error: 'Equipment does not exist' };
  }

  // Check overlapping time slot: existingStart < newEnd AND existingEnd > newStart
  let overlapQuery = `
    SELECT id FROM bookings 
    WHERE equipment_id = ? 
      AND start_at < ? 
      AND end_at > ?
  `;
  const params = [equipmentId, endAt, startAt];

  if (currentBookingId) {
    overlapQuery += ' AND id != ?';
    params.push(currentBookingId);
  }

  const overlap = db.prepare(overlapQuery).get(...params);
  if (overlap) {
    return { status: 409, error: 'Booking time overlaps with an existing booking' };
  }

  return null;
}

// POST /api/bookings
app.post('/api/bookings', async (c) => {
  const body = await c.req.json();
  const validationError = validateAndCheckOverlap(body);
  if (validationError) {
    return c.json({ error: validationError.error }, validationError.status as any);
  }

  const id = `bk-${randomUUID()}`;
  db.prepare(`
    INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.equipmentId, body.borrowerName, body.startAt, body.endAt, body.purpose);

  return c.json({ id, ...body }, 201);
});

// PATCH /api/bookings/:id
app.patch('/api/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
  if (!existing) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  const body = await c.req.json();
  const merged = {
    equipmentId: body.equipmentId ?? existing.equipment_id,
    borrowerName: body.borrowerName ?? existing.borrower_name,
    startAt: body.startAt ?? existing.start_at,
    endAt: body.endAt ?? existing.end_at,
    purpose: body.purpose ?? existing.purpose,
  };

  const validationError = validateAndCheckOverlap(merged, id);
  if (validationError) {
    return c.json({ error: validationError.error }, validationError.status as any);
  }

  db.prepare(`
    UPDATE bookings 
    SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?
    WHERE id = ?
  `).run(merged.equipmentId, merged.borrowerName, merged.startAt, merged.endAt, merged.purpose, id);

  return c.json({ id, ...merged }, 200);
});

// DELETE /api/bookings/:id
app.delete('/api/bookings/:id', (c) => {
  const id = c.req.param('id');
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  if (result.changes === 0) {
    return c.json({ error: 'Booking not found' }, 404);
  }
  return c.body(null, 204);
});

serve({ fetch: app.fetch, port: 8787 });
console.log('Server running on http://localhost:8787');