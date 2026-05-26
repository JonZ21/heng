import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createDb, closeDb } from '../db.js';
import { createApp } from '../app.js';

describe('GET /api/ratings', () => {
  let db, app;
  beforeEach(() => { db = createDb(':memory:'); app = createApp(db); });
  afterEach(() => closeDb(db));

  it('returns empty array when no ratings exist', async () => {
    const res = await request(app).get('/api/ratings');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns ratings ordered by week_start descending, limited by ?limit', async () => {
    db.prepare('INSERT INTO week_ratings (week_start, rating) VALUES (?, ?)').run('2026-05-11', 7);
    db.prepare('INSERT INTO week_ratings (week_start, rating) VALUES (?, ?)').run('2026-05-18', 9);
    db.prepare('INSERT INTO week_ratings (week_start, rating) VALUES (?, ?)').run('2026-05-25', 6);

    const res = await request(app).get('/api/ratings?limit=2');
    expect(res.body).toHaveLength(2);
    expect(res.body[0].week_start).toBe('2026-05-25');
    expect(res.body[1].week_start).toBe('2026-05-18');
  });
});

describe('POST /api/ratings', () => {
  let db, app;
  beforeEach(() => { db = createDb(':memory:'); app = createApp(db); });
  afterEach(() => closeDb(db));

  it('creates a rating', async () => {
    const res = await request(app)
      .post('/api/ratings')
      .send({ week_start: '2026-05-25', rating: 8, notes: 'Good week' });
    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(8);
    expect(res.body.notes).toBe('Good week');
  });

  it('returns 400 when rating is out of range', async () => {
    const res = await request(app)
      .post('/api/ratings')
      .send({ week_start: '2026-05-25', rating: 11 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when week_start or rating is missing', async () => {
    const res = await request(app).post('/api/ratings').send({ rating: 7 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/ratings/:id', () => {
  let db, app;
  beforeEach(() => { db = createDb(':memory:'); app = createApp(db); });
  afterEach(() => closeDb(db));

  it('updates rating and notes', async () => {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO week_ratings (week_start, rating) VALUES (?, ?)'
    ).run('2026-05-25', 5);

    const res = await request(app)
      .put(`/api/ratings/${lastInsertRowid}`)
      .send({ rating: 9, notes: 'Actually great' });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(9);
    expect(res.body.notes).toBe('Actually great');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/ratings/9999').send({ rating: 5 });
    expect(res.status).toBe(404);
  });
});
