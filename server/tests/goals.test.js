import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createDb, closeDb } from '../db.js';
import { createApp } from '../app.js';

describe('GET /api/goals', () => {
  let db, app;
  beforeEach(() => { db = createDb(':memory:'); app = createApp(db); });
  afterEach(() => closeDb(db));

  it('returns empty array when no goals exist', async () => {
    const res = await request(app).get('/api/goals?week=2026-05-25');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('does not carry over completed goals from prior weeks', async () => {
    db.prepare('INSERT INTO weekly_goals (week_start, title, completed) VALUES (?, ?, ?)').run('2026-05-25', 'Goal A', 0);
    db.prepare('INSERT INTO weekly_goals (week_start, title, completed) VALUES (?, ?, ?)').run('2026-05-18', 'Goal B', 1);
    const res = await request(app).get('/api/goals?week=2026-05-25');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Goal A');
  });

  it('returns incomplete goals from prior weeks (carryover)', async () => {
    db.prepare('INSERT INTO weekly_goals (week_start, title, completed) VALUES (?, ?, ?)').run('2026-05-18', 'Old incomplete', 0);
    db.prepare('INSERT INTO weekly_goals (week_start, title, completed) VALUES (?, ?, ?)').run('2026-05-18', 'Old complete', 1);
    db.prepare('INSERT INTO weekly_goals (week_start, title) VALUES (?, ?)').run('2026-05-25', 'Current goal');
    const res = await request(app).get('/api/goals?week=2026-05-25');
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Old incomplete');
    expect(res.body[1].title).toBe('Current goal');
  });

  it('excludes incomplete goals older than 4 weeks', async () => {
    db.prepare('INSERT INTO weekly_goals (week_start, title, completed) VALUES (?, ?, ?)').run('2026-04-20', 'Too old', 0);
    db.prepare('INSERT INTO weekly_goals (week_start, title) VALUES (?, ?)').run('2026-05-25', 'Current goal');
    const res = await request(app).get('/api/goals?week=2026-05-25');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Current goal');
  });
});

describe('POST /api/goals', () => {
  let db, app;
  beforeEach(() => { db = createDb(':memory:'); app = createApp(db); });
  afterEach(() => closeDb(db));

  it('creates a new goal and returns it', async () => {
    const res = await request(app)
      .post('/api/goals')
      .send({ week_start: '2026-05-25', title: 'Ship it' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Ship it');
    expect(res.body.completed).toBe(0);
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/goals').send({ week_start: '2026-05-25' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/goals/:id', () => {
  let db, app;
  beforeEach(() => { db = createDb(':memory:'); app = createApp(db); });
  afterEach(() => closeDb(db));

  it('toggles completed', async () => {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO weekly_goals (week_start, title) VALUES (?, ?)'
    ).run('2026-05-25', 'Do thing');

    const res = await request(app).put(`/api/goals/${lastInsertRowid}`).send({ completed: 1 });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(1);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/goals/9999').send({ completed: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/goals/:id', () => {
  let db, app;
  beforeEach(() => { db = createDb(':memory:'); app = createApp(db); });
  afterEach(() => closeDb(db));

  it('deletes a goal', async () => {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO weekly_goals (week_start, title) VALUES (?, ?)'
    ).run('2026-05-25', 'To delete');

    const res = await request(app).delete(`/api/goals/${lastInsertRowid}`);
    expect(res.status).toBe(204);

    const row = db.prepare('SELECT * FROM weekly_goals WHERE id = ?').get(lastInsertRowid);
    expect(row).toBeUndefined();
  });
});
