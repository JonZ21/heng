import { Router } from 'express';

export default function goalsRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const { week } = req.query;
    const rows = week
      ? db.prepare('SELECT * FROM weekly_goals WHERE week_start = ? ORDER BY id ASC').all(week)
      : db.prepare('SELECT * FROM weekly_goals ORDER BY id ASC').all();
    res.json(rows);
  });

  router.post('/', (req, res) => {
    const { week_start, title } = req.body;
    if (!title || !week_start) return res.status(400).json({ error: 'week_start and title required' });
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO weekly_goals (week_start, title) VALUES (?, ?)'
    ).run(week_start, title);
    const row = db.prepare('SELECT * FROM weekly_goals WHERE id = ?').get(lastInsertRowid);
    res.status(201).json(row);
  });

  router.put('/:id', (req, res) => {
    const { completed } = req.body;
    const { changes } = db.prepare(
      'UPDATE weekly_goals SET completed = ? WHERE id = ?'
    ).run(completed ? 1 : 0, req.params.id);
    if (changes === 0) return res.status(404).json({ error: 'Not found' });
    const row = db.prepare('SELECT * FROM weekly_goals WHERE id = ?').get(req.params.id);
    res.json(row);
  });

  router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM weekly_goals WHERE id = ?').run(req.params.id);
    res.status(204).end();
  });

  return router;
}
