import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDb, closeDb } from '../db.js';

describe('database schema', () => {
  let db;

  beforeEach(() => {
    db = createDb(':memory:');
  });

  afterEach(() => {
    closeDb(db);
  });

  it('creates weekly_goals table', () => {
    const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='weekly_goals'"
    ).get();
    expect(row.name).toBe('weekly_goals');
  });

  it('creates week_ratings table', () => {
    const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='week_ratings'"
    ).get();
    expect(row.name).toBe('week_ratings');
  });

  it('creates integrations_config table', () => {
    const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='integrations_config'"
    ).get();
    expect(row.name).toBe('integrations_config');
  });

  it('inserts and retrieves a goal', () => {
    db.prepare(
      'INSERT INTO weekly_goals (week_start, title, completed) VALUES (?, ?, ?)'
    ).run('2026-05-25', 'Ship the dashboard', 0);

    const row = db.prepare('SELECT * FROM weekly_goals WHERE title = ?').get('Ship the dashboard');
    expect(row.title).toBe('Ship the dashboard');
    expect(row.week_start).toBe('2026-05-25');
    expect(row.completed).toBe(0);
  });
});
