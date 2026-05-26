import Database from 'better-sqlite3';

export function createDb(path) {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_goals (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT    NOT NULL,
      title      TEXT    NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS week_ratings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT    NOT NULL UNIQUE,
      rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10),
      notes      TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS integrations_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

export function closeDb(db) {
  db.close();
}
