import { Router } from 'express';

export default function ratingsRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const rows = db.prepare(
      'SELECT * FROM week_ratings ORDER BY week_start DESC LIMIT ?'
    ).all(limit);
    res.json(rows);
  });

  router.post('/', (req, res) => {
    const { week_start, rating, notes } = req.body;
    if (!week_start || rating === undefined) {
      return res.status(400).json({ error: 'week_start and rating required' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'rating must be a number between 1–10' });
    }
    try {
      const { lastInsertRowid } = db.prepare(
        'INSERT INTO week_ratings (week_start, rating, notes) VALUES (?, ?, ?)'
      ).run(week_start, rating, notes ?? null);
      const row = db.prepare('SELECT * FROM week_ratings WHERE id = ?').get(lastInsertRowid);
      res.status(201).json(row);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/:id', (req, res) => {
    const { rating, notes } = req.body;
    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 10)) {
      return res.status(400).json({ error: 'rating must be a number between 1–10' });
    }
    const existing = db.prepare('SELECT * FROM week_ratings WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    db.prepare('UPDATE week_ratings SET rating = ?, notes = ? WHERE id = ?').run(
      rating ?? existing.rating,
      notes ?? existing.notes,
      req.params.id
    );
    const row = db.prepare('SELECT * FROM week_ratings WHERE id = ?').get(req.params.id);
    res.json(row);
  });

  router.delete('/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM week_ratings WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare('DELETE FROM week_ratings WHERE id = ?').run(req.params.id);
    res.status(204).end();
  });

  return router;
}
