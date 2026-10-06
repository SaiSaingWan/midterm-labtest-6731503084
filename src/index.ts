import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// GET /api/equipment
app.get('/api/equipment', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, location FROM equipment').all();
  return c.json(results, 200);
});

// GET /api/bookings
app.get('/api/bookings', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, equipment_id AS equipmentId, borrower_name AS borrowerName, 
           start_at AS startAt, end_at AS endAt, purpose 
    FROM bookings
  `).all();
  return c.json(results, 200);
});

// GET /api/bookings/:id
app.get('/api/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const booking = await c.env.DB.prepare(`
    SELECT id, equipment_id AS equipmentId, borrower_name AS borrowerName, 
           start_at AS startAt, end_at AS endAt, purpose 
    FROM bookings WHERE id = ?
  `).bind(id).first();

  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404);
  }
  return c.json(booking, 200);
});

// Validation & Overlap Helper
async function validateAndCheckOverlap(db: D1Database, data: any, currentBookingId: string | null = null) {
  const { equipmentId, borrowerName, startAt, endAt, purpose } = data;

  if (!equipmentId || !borrowerName || !startAt || !endAt || !purpose) {
    return { status: 400, error: 'Missing required fields' };
  }

  if (new Date(startAt) >= new Date(endAt)) {
    return { status: 400, error: 'startAt must be before endAt' };
  }

  const equipmentExists = await db.prepare('SELECT id FROM equipment WHERE id = ?').bind(equipmentId).first();
  if (!equipmentExists) {
    return { status: 400, error: 'Equipment does not exist' };
  }

  let overlapQuery = `
    SELECT id FROM bookings 
    WHERE equipment_id = ? 
      AND start_at < ? 
      AND end_at > ?
  `;
  const params: any[] = [equipmentId, endAt, startAt];

  if (currentBookingId) {
    overlapQuery += ' AND id != ?';
    params.push(currentBookingId);
  }

  const overlap = await db.prepare(overlapQuery).bind(...params).first();
  if (overlap) {
    return { status: 409, error: 'Booking time overlaps with an existing booking' };
  }

  return null;
}

// POST /api/bookings
app.post('/api/bookings', async (c) => {
  const body = await c.req.json();
  const validationError = await validateAndCheckOverlap(c.env.DB, body);
  if (validationError) {
    return c.json({ error: validationError.error }, validationError.status as any);
  }

  const id = `bk-${crypto.randomUUID().slice(0, 8)}`;
  await c.env.DB.prepare(`
    INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, body.equipmentId, body.borrowerName, body.startAt, body.endAt, body.purpose).run();

  return c.json({ id, ...body }, 201);
});

// PATCH /api/bookings/:id
app.patch('/api/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const existing: any = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
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

  const validationError = await validateAndCheckOverlap(c.env.DB, merged, id);
  if (validationError) {
    return c.json({ error: validationError.error }, validationError.status as any);
  }

  await c.env.DB.prepare(`
    UPDATE bookings 
    SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ?
    WHERE id = ?
  `).bind(merged.equipmentId, merged.borrowerName, merged.startAt, merged.endAt, merged.purpose, id).run();

  return c.json({ id, ...merged }, 200);
});

// DELETE /api/bookings/:id
app.delete('/api/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run();
  if (!result.success || result.meta.changes === 0) {
    return c.json({ error: 'Booking not found' }, 404);
  }
  return c.body(null, 204);
});

export default app;