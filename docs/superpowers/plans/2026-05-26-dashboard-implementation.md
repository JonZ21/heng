# Personal Stats Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bento-grid personal dashboard with Linear integration, weekly goals/ratings, sleep/wake iPad behavior, deployed to Railway.

**Architecture:** Express (ESM) serves REST API + WebSocket hub + React build as static files. Integration modules in `server/integrations/` auto-load on startup and poll external APIs, broadcasting results via WebSocket to all connected clients. SQLite on a Railway persistent volume stores goals and ratings. React (Vite) handles all UI.

**Tech Stack:** Node.js 18+, Express 4, better-sqlite3, ws, @linear/sdk, React 18, Vite 5, vitest, supertest, plain CSS custom properties

---

## File Structure

```
/
├── package.json                   # root: scripts only (dev, build, test, start)
├── vitest.config.js               # vitest: server tests, node environment
├── .env.example
├── .gitignore
├── railway.json                   # Railway: build + start commands
│
├── server/
│   ├── package.json               # server deps (type: module)
│   ├── index.js                   # entry: listen on PORT
│   ├── app.js                     # creates + exports Express app (imported by tests)
│   ├── db.js                      # SQLite connection + schema migrations
│   ├── ws.js                      # WebSocket hub: client registry + broadcast
│   ├── routes/
│   │   ├── goals.js               # GET/POST/PUT/DELETE /api/goals
│   │   ├── ratings.js             # GET/POST/PUT /api/ratings
│   │   └── integrations.js        # GET /api/integrations, POST /api/integrations/:name/refresh
│   ├── integrations/
│   │   ├── loader.js              # scans integrations/, loads modules, manages poll loops
│   │   └── linear.js              # Linear API integration module
│   └── tests/
│       ├── db.test.js
│       ├── goals.test.js
│       ├── ratings.test.js
│       ├── loader.test.js
│       └── linear.test.js
│
└── client/
    ├── package.json               # client deps
    ├── vite.config.js             # proxy /api + /ws to server in dev
    ├── index.html
    └── src/
        ├── main.jsx               # React root mount
        ├── App.jsx                # sleep/wake state, WebSocket provider
        ├── App.css                # CSS variables, global reset, bento grid
        ├── hooks/
        │   ├── useWebSocket.js    # connect + auto-reconnect + message dispatch
        │   ├── useGoals.js        # fetch goals, add, toggle complete
        │   └── useRatings.js      # fetch ratings, add rating
        ├── utils/
        │   └── time.js            # getWeekStart, dayProgress, weekProgress, formatTime
        └── components/
            ├── SleepScreen.jsx    # dark overlay: clock + progress bar + tap hint
            ├── BentoGrid.jsx      # CSS grid layout wrapper
            ├── ClockCard.jsx      # live digital clock, updates every second
            ├── ProgressPie.jsx    # reusable SVG donut chart
            ├── LinearWidget.jsx   # Linear tasks: in progress / upcoming / overdue
            ├── GoalsWidget.jsx    # weekly goals checklist + add goal input
            ├── RatingsChart.jsx   # XY chart: SVG nodes + connecting lines
            ├── StreakCard.jsx     # consecutive rated weeks counter
            └── IntegrationsCard.jsx # integration status: active vs coming-soon
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `server/package.json`
- Create: `client/package.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "heng",
  "private": true,
  "type": "module",
  "scripts": {
    "dev:server": "node --watch server/index.js",
    "dev:client": "cd client && npx vite",
    "build": "cd client && npx vite build",
    "start": "node server/index.js",
    "test": "vitest run"
  }
}
```

(`"type": "module"` is required so that `vitest.config.js` — which uses ESM `import` syntax — is treated as an ES module by Node.)

- [ ] **Step 2: Create vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['server/tests/**/*.test.js'],
    environment: 'node',
    pool: 'forks',
  },
});
```

(`pool: 'forks'` is required for `better-sqlite3` which is a native Node addon.)

- [ ] **Step 3: Create server/package.json**

```json
{
  "name": "heng-server",
  "type": "module",
  "version": "1.0.0",
  "dependencies": {
    "@linear/sdk": "^26.0.0",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "ws": "^8.17.0"
  },
  "devDependencies": {
    "supertest": "^7.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 4: Install server dependencies**

```bash
cd server && npm install
```

- [ ] **Step 5: Create client/package.json**

```json
{
  "name": "heng-client",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.3.0"
  }
}
```

- [ ] **Step 6: Install client dependencies**

```bash
cd client && npm install
```

- [ ] **Step 7: Create .env.example**

```bash
# Copy to .env and fill in values
LINEAR_API_KEY=lin_api_xxxxxxxxxxxx
DB_PATH=./dashboard.db
PORT=3001
NODE_ENV=development
```

- [ ] **Step 8: Create .gitignore**

```
node_modules/
server/node_modules/
client/node_modules/
.env
*.db
client/dist/
.superpowers/
```

- [ ] **Step 9: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <title>Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Create railway.json**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd client && npm install && npm run build && cd ../server && npm install"
  },
  "deploy": {
    "startCommand": "node server/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

- [ ] **Step 11: Commit scaffold**

```bash
git add .
git commit -m "feat: project scaffold — server + client packages, Railway config"
```

---

## Task 2: Database Layer

**Files:**
- Create: `server/db.js`
- Create: `server/tests/db.test.js`

- [ ] **Step 1: Write the failing test**

`server/tests/db.test.js`:

```js
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
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx vitest run server/tests/db.test.js
```

Expected: FAIL — `Cannot find module '../db.js'`

- [ ] **Step 3: Implement server/db.js**

```js
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
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx vitest run server/tests/db.test.js
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/db.js server/tests/db.test.js
git commit -m "feat: SQLite schema — weekly_goals, week_ratings, integrations_config"
```

---

## Task 3: Goals API

**Files:**
- Create: `server/routes/goals.js`
- Create: `server/app.js`
- Create: `server/tests/goals.test.js`

- [ ] **Step 1: Create server/app.js (needed to mount routes for testing)**

```js
import express from 'express';
import cors from 'cors';
import goalsRouter from './routes/goals.js';
import ratingsRouter from './routes/ratings.js';
import integrationsRouter from './routes/integrations.js';

export function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/goals', goalsRouter(db));
  app.use('/api/ratings', ratingsRouter(db));
  app.use('/api/integrations', integrationsRouter());

  return app;
}
```

- [ ] **Step 2: Write the failing test**

`server/tests/goals.test.js`:

```js
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

  it('returns goals for the requested week only', async () => {
    db.prepare('INSERT INTO weekly_goals (week_start, title) VALUES (?, ?)').run('2026-05-25', 'Goal A');
    db.prepare('INSERT INTO weekly_goals (week_start, title) VALUES (?, ?)').run('2026-05-18', 'Goal B');
    const res = await request(app).get('/api/goals?week=2026-05-25');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Goal A');
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
```

- [ ] **Step 3: Run test — expect failure**

```bash
npx vitest run server/tests/goals.test.js
```

Expected: FAIL — `Cannot find module '../routes/goals.js'`

- [ ] **Step 4: Implement server/routes/goals.js**

```js
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
```

- [ ] **Step 5: Create stub routes so app.js compiles (ratings + integrations stubs)**

`server/routes/ratings.js`:
```js
import { Router } from 'express';
export default function ratingsRouter(db) {
  return Router();
}
```

`server/routes/integrations.js`:
```js
import { Router } from 'express';
export default function integrationsRouter() {
  return Router();
}
```

- [ ] **Step 6: Run test — expect pass**

```bash
npx vitest run server/tests/goals.test.js
```

Expected: PASS — all 8 tests pass

- [ ] **Step 7: Commit**

```bash
git add server/app.js server/routes/goals.js server/routes/ratings.js server/routes/integrations.js server/tests/goals.test.js
git commit -m "feat: Goals API — CRUD endpoints with tests"
```

---

## Task 4: Ratings API

**Files:**
- Modify: `server/routes/ratings.js`
- Create: `server/tests/ratings.test.js`

- [ ] **Step 1: Write the failing test**

`server/tests/ratings.test.js`:

```js
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
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx vitest run server/tests/ratings.test.js
```

Expected: FAIL — all tests fail (stub router returns nothing)

- [ ] **Step 3: Implement server/routes/ratings.js**

```js
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
    if (rating < 1 || rating > 10 || !Number.isInteger(rating)) {
      return res.status(400).json({ error: 'rating must be an integer 1–10' });
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
    if (rating !== undefined && (rating < 1 || rating > 10 || !Number.isInteger(rating))) {
      return res.status(400).json({ error: 'rating must be an integer 1–10' });
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

  return router;
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx vitest run server/tests/ratings.test.js
```

Expected: PASS — all 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/routes/ratings.js server/tests/ratings.test.js
git commit -m "feat: Ratings API — CRUD endpoints with tests"
```

---

## Task 5: Integration Loader

**Files:**
- Create: `server/integrations/loader.js`
- Create: `server/tests/loader.test.js`

- [ ] **Step 1: Write the failing test**

`server/tests/loader.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLoader } from '../integrations/loader.js';

const mockModule = {
  name: 'test-integration',
  interval: null,
  async fetch() {
    return { items: [1, 2, 3] };
  },
};

describe('createLoader', () => {
  it('registers a module and returns its name in list()', () => {
    const broadcast = vi.fn();
    const loader = createLoader(broadcast);
    loader.register(mockModule, {});
    expect(loader.list()).toEqual([{ name: 'test-integration', status: 'active' }]);
  });

  it('calls broadcast after fetch()', async () => {
    const broadcast = vi.fn();
    const loader = createLoader(broadcast);
    loader.register(mockModule, {});
    await loader.refresh('test-integration');
    expect(broadcast).toHaveBeenCalledWith({
      type: 'integration',
      source: 'test-integration',
      data: { items: [1, 2, 3] },
    });
  });

  it('marks integration as error when fetch throws', async () => {
    const broadcast = vi.fn();
    const loader = createLoader(broadcast);
    const badModule = {
      name: 'bad',
      interval: null,
      async fetch() { throw new Error('API down'); },
    };
    loader.register(badModule, {});
    await loader.refresh('bad');
    const status = loader.list().find(i => i.name === 'bad');
    expect(status.status).toBe('error');
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx vitest run server/tests/loader.test.js
```

Expected: FAIL — `Cannot find module '../integrations/loader.js'`

- [ ] **Step 3: Implement server/integrations/loader.js**

```js
export function createLoader(broadcast) {
  const registry = new Map(); // name → { module, config, status, timer }

  function register(module, config) {
    registry.set(module.name, { module, config, status: 'active', timer: null });
    if (module.interval) {
      const entry = registry.get(module.name);
      entry.timer = setInterval(() => refresh(module.name), module.interval);
    }
  }

  async function refresh(name) {
    const entry = registry.get(name);
    if (!entry) return;
    try {
      const data = await entry.module.fetch(entry.config);
      entry.status = 'active';
      broadcast({ type: 'integration', source: name, data });
    } catch (err) {
      entry.status = 'error';
      console.error(`[${name}] fetch error:`, err.message);
    }
  }

  function list() {
    return [...registry.values()].map(({ module, status }) => ({
      name: module.name,
      status,
    }));
  }

  function stopAll() {
    for (const entry of registry.values()) {
      if (entry.timer) clearInterval(entry.timer);
    }
  }

  return { register, refresh, list, stopAll };
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx vitest run server/tests/loader.test.js
```

Expected: PASS — all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/integrations/loader.js server/tests/loader.test.js
git commit -m "feat: integration loader — register, poll, broadcast, error tracking"
```

---

## Task 6: Linear Integration Module

**Files:**
- Create: `server/integrations/linear.js`
- Create: `server/tests/linear.test.js`

- [ ] **Step 1: Write the failing test**

`server/tests/linear.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @linear/sdk before importing the module
vi.mock('@linear/sdk', () => ({
  LinearClient: vi.fn().mockImplementation(() => ({
    viewer: Promise.resolve({
      assignedIssues: vi.fn().mockResolvedValue({
        nodes: [
          {
            id: '1',
            title: 'Build WebSocket layer',
            identifier: 'ENG-142',
            dueDate: '2026-05-30',
            state: { name: 'In Progress', type: 'started' },
          },
          {
            id: '2',
            title: 'Write tests',
            identifier: 'ENG-145',
            dueDate: null,
            state: { name: 'Todo', type: 'unstarted' },
          },
          {
            id: '3',
            title: 'Old ticket',
            identifier: 'ENG-100',
            dueDate: '2026-01-01',
            state: { name: 'Todo', type: 'unstarted' },
          },
        ],
      }),
    }),
  })),
}));

const { default: linearModule } = await import('../integrations/linear.js');

describe('linear integration module', () => {
  it('has required shape', () => {
    expect(linearModule.name).toBe('linear');
    expect(typeof linearModule.interval).toBe('number');
    expect(typeof linearModule.fetch).toBe('function');
  });

  it('fetch returns inProgress, upcoming, overdue buckets', async () => {
    const data = await linearModule.fetch({ linear_api_key: 'test-key' });
    expect(data.inProgress).toHaveLength(1);
    expect(data.inProgress[0].identifier).toBe('ENG-142');
    expect(data.upcoming).toHaveLength(1);
    expect(data.upcoming[0].identifier).toBe('ENG-145');
    expect(data.overdue).toHaveLength(1);
    expect(data.overdue[0].identifier).toBe('ENG-100');
    expect(data.lastUpdated).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx vitest run server/tests/linear.test.js
```

Expected: FAIL — `Cannot find module '../integrations/linear.js'`

- [ ] **Step 3: Implement server/integrations/linear.js**

```js
import { LinearClient } from '@linear/sdk';

export default {
  name: 'linear',
  interval: 30_000,

  async fetch(config) {
    const client = new LinearClient({ apiKey: config.linear_api_key });
    const viewer = await client.viewer;
    const result = await viewer.assignedIssues({
      filter: {
        state: { type: { in: ['started', 'unstarted', 'backlog'] } },
        completedAt: { null: true },
      },
    });

    const today = new Date().toISOString().split('T')[0];
    const inProgress = [];
    const upcoming = [];
    const overdue = [];

    for (const issue of result.nodes) {
      const isOverdue = issue.dueDate && issue.dueDate < today;
      if (issue.state.type === 'started') {
        inProgress.push(formatIssue(issue));
      } else if (isOverdue) {
        overdue.push(formatIssue(issue));
      } else {
        upcoming.push(formatIssue(issue));
      }
    }

    return { inProgress, upcoming, overdue, lastUpdated: new Date().toISOString() };
  },
};

function formatIssue(issue) {
  return {
    id: issue.id,
    title: issue.title,
    identifier: issue.identifier,
    dueDate: issue.dueDate ?? null,
    stateName: issue.state.name,
    stateType: issue.state.type,
  };
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx vitest run server/tests/linear.test.js
```

Expected: PASS — all 2 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/integrations/linear.js server/tests/linear.test.js
git commit -m "feat: Linear integration module — in-progress/upcoming/overdue buckets"
```

---

## Task 7: WebSocket Hub

**Files:**
- Create: `server/ws.js`

- [ ] **Step 1: Implement server/ws.js**

(WebSocket hub is tested manually — automated WS server tests add significant complexity for limited value in a personal project.)

```js
import { WebSocketServer } from 'ws';

export function createWsHub(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set();

  wss.on('connection', (socket) => {
    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
    socket.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'pong') return;
      } catch {}
    });
  });

  // Heartbeat to detect stale connections
  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'ping' }));
      }
    }
  }, 30_000);

  function broadcast(payload) {
    const msg = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === 1) client.send(msg);
    }
  }

  function close() {
    clearInterval(heartbeat);
    wss.close();
  }

  return { broadcast, close };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/ws.js
git commit -m "feat: WebSocket hub — broadcast to all connected clients, heartbeat"
```

---

## Task 8: Integrations Route + Server Entry Point

**Files:**
- Modify: `server/routes/integrations.js`
- Create: `server/index.js`

- [ ] **Step 1: Implement server/routes/integrations.js**

```js
import { Router } from 'express';

export default function integrationsRouter(loader) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(loader ? loader.list() : []);
  });

  router.post('/:name/refresh', async (req, res) => {
    if (!loader) return res.status(503).json({ error: 'No loader' });
    await loader.refresh(req.params.name);
    res.json({ ok: true });
  });

  return router;
}
```

- [ ] **Step 2: Update server/app.js to accept loader**

```js
import express from 'express';
import cors from 'cors';
import goalsRouter from './routes/goals.js';
import ratingsRouter from './routes/ratings.js';
import integrationsRouter from './routes/integrations.js';

export function createApp(db, loader = null) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/goals', goalsRouter(db));
  app.use('/api/ratings', ratingsRouter(db));
  app.use('/api/integrations', integrationsRouter(loader));

  return app;
}
```

- [ ] **Step 3: Create server/index.js**

```js
import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createDb } from './db.js';
import { createApp } from './app.js';
import { createWsHub } from './ws.js';
import { createLoader } from './integrations/loader.js';
import linearModule from './integrations/linear.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || './dashboard.db';

const db = createDb(DB_PATH);
const httpServer = http.createServer();
const { broadcast, close: closeWs } = createWsHub(httpServer);
const loader = createLoader(broadcast);

// Load integrations
const linearApiKey = db.prepare("SELECT value FROM integrations_config WHERE key = 'linear_api_key'").get();
if (linearApiKey || process.env.LINEAR_API_KEY) {
  loader.register(linearModule, {
    linear_api_key: process.env.LINEAR_API_KEY || linearApiKey.value,
  });
  // Initial fetch on startup
  loader.refresh('linear');
}

const app = createApp(db, loader);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

httpServer.on('request', app);
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  closeWs();
  db.close();
  process.exit(0);
});
```

- [ ] **Step 4: Create .env from .env.example and add your Linear API key**

```bash
cp .env.example .env
# Edit .env: set LINEAR_API_KEY=lin_api_your_actual_key
```

- [ ] **Step 5: Start the server and verify it runs**

```bash
node server/index.js
```

Expected output:
```
Server running on http://localhost:3001
```

Then in another terminal:
```bash
curl http://localhost:3001/api/goals?week=2026-05-26
# Expected: []

curl http://localhost:3001/api/integrations
# Expected: [{"name":"linear","status":"active"}]
```

- [ ] **Step 6: Commit**

```bash
git add server/index.js server/routes/integrations.js server/app.js
git commit -m "feat: server entry point — wires DB, WebSocket, integration loader, static serving"
```

---

## Task 9: React Scaffold + CSS

**Files:**
- Create: `client/vite.config.js`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/App.css`

- [ ] **Step 1: Create client/vite.config.js**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': { target: 'ws://localhost:3001', ws: true },
    },
  },
});
```

- [ ] **Step 2: Create client/src/App.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --blue:       #5b9bc8;
  --blue-light: #d4eaf7;
  --blue-mid:   #a8cfe8;
  --blue-dark:  #2d6a92;
  --lav:        #9b85d4;
  --lav-light:  #e4ddf7;
  --lav-mid:    #c4b4e8;
  --text:       #1a1a2e;
  --text-sub:   #8a8a9a;
  --border:     #f0eff5;
  --bg:         #f2f0f8;
  --card:       #ffffff;
  --radius:     20px;
  --shadow:     0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(91,155,200,0.07);
  --font:       -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  background: var(--bg);
  font-family: var(--font);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.1rem 1.2rem;
  overflow: hidden;
  position: relative;
}

.card-label {
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-sub);
  margin-bottom: 0.75rem;
}

/* Bento grid */
.bento {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 1.2fr;
  grid-template-rows: auto auto auto;
  gap: 10px;
  padding: 12px;
  height: 100vh;
  width: 100vw;
}

/* Sleep/wake transitions */
.sleep-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #0a0f1e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.6s ease;
}

.sleep-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}
```

- [ ] **Step 3: Create client/src/main.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Create client/src/App.jsx (shell — widgets added in later tasks)**

```jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import SleepScreen from './components/SleepScreen.jsx';
import BentoGrid from './components/BentoGrid.jsx';

const SLEEP_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export default function App() {
  const [sleeping, setSleeping] = useState(false);
  const [linearData, setLinearData] = useState(null);
  const timerRef = useRef(null);

  const wake = useCallback(() => {
    setSleeping(false);
    resetTimer();
  }, []);

  function resetTimer() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSleeping(true), SLEEP_TIMEOUT_MS);
  }

  useEffect(() => {
    resetTimer();
    const events = ['click', 'touchstart', 'keydown', 'mousemove'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, []);

  return (
    <>
      <SleepScreen sleeping={sleeping} onWake={wake} />
      <BentoGrid linearData={linearData} setLinearData={setLinearData} />
    </>
  );
}
```

- [ ] **Step 5: Start dev server and verify blank page loads without errors**

In one terminal: `node server/index.js`
In another: `cd client && npx vite`

Open `http://localhost:5173` — expect a blank page with no console errors.

- [ ] **Step 6: Commit**

```bash
git add client/vite.config.js client/src/main.jsx client/src/App.jsx client/src/App.css
git commit -m "feat: React scaffold — Vite, CSS variables, bento grid, sleep/wake shell"
```

---

## Task 10: Utility Functions

**Files:**
- Create: `client/src/utils/time.js`

- [ ] **Step 1: Create client/src/utils/time.js**

(These are pure functions — verify manually in browser console rather than a test suite, per the spec's no-frontend-tests decision.)

```js
/**
 * Returns the ISO date string (YYYY-MM-DD) of the Monday
 * of the week containing the given date.
 */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Fraction of today elapsed (0–1).
 * 0 = midnight, 1 = end of day.
 */
export function dayProgress(date = new Date()) {
  const seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return seconds / 86400;
}

/**
 * Fraction of the Mon–Sun week elapsed (0–1).
 */
export function weekProgress(date = new Date()) {
  const day = date.getDay(); // 0=Sun … 6=Sat
  const dayIndex = day === 0 ? 6 : day - 1; // Mon=0 … Sun=6
  const secondsIntoWeek = dayIndex * 86400 + date.getHours() * 3600 +
    date.getMinutes() * 60 + date.getSeconds();
  return secondsIntoWeek / (7 * 86400);
}

/**
 * Format a Date as HH:MM.
 */
export function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Format a Date as "Monday · May 26".
 */
export function formatDateLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * Compute consecutive streak of weeks that have a rating,
 * working backwards from the current week.
 * ratings: array of { week_start: 'YYYY-MM-DD' } sorted desc.
 */
export function computeStreak(ratings) {
  if (!ratings.length) return 0;

  let streak = 0;
  let cursor = new Date();
  // Move cursor to Monday of current week
  const currentWeekStart = getWeekStart(cursor);

  const ratedWeeks = new Set(ratings.map(r => r.week_start));

  let weekStart = currentWeekStart;
  while (ratedWeeks.has(weekStart)) {
    streak++;
    // Move back 7 days
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    weekStart = d.toISOString().split('T')[0];
  }

  return streak;
}
```

- [ ] **Step 2: Verify in browser console**

With the dev server running, open browser console and paste:

```js
import('/src/utils/time.js').then(m => {
  console.log('weekStart:', m.getWeekStart());
  console.log('dayProgress:', m.dayProgress());
  console.log('weekProgress:', m.weekProgress());
  console.log('time:', m.formatTime());
  console.log('label:', m.formatDateLabel());
  console.log('streak (empty):', m.computeStreak([]));
  console.log('streak (2 weeks):', m.computeStreak([
    { week_start: m.getWeekStart() },
    { week_start: new Date(Date.now() - 7*86400000).toISOString().split('T')[0] }
  ]));
});
```

Expected: all values look correct for current time/date

- [ ] **Step 3: Commit**

```bash
git add client/src/utils/time.js
git commit -m "feat: time utilities — weekStart, dayProgress, weekProgress, streak"
```

---

## Task 11: SleepScreen Component

**Files:**
- Create: `client/src/components/SleepScreen.jsx`

- [ ] **Step 1: Create client/src/components/SleepScreen.jsx**

```jsx
import { useState, useEffect } from 'react';
import { formatTime, formatDateLabel, dayProgress } from '../utils/time.js';

export default function SleepScreen({ sleeping, onWake }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = dayProgress(time);

  return (
    <div
      className={`sleep-overlay${sleeping ? '' : ' hidden'}`}
      onClick={onWake}
    >
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{
          fontSize: '4rem',
          fontWeight: 200,
          letterSpacing: '0.06em',
          color: 'rgba(255,255,255,0.85)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatTime(time)}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.3)',
          marginTop: '0.5rem',
          letterSpacing: '0.08em',
        }}>
          {formatDateLabel(time)}
        </div>
      </div>

      {/* Hairline day progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '2px',
        background: 'rgba(255,255,255,0.04)',
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, rgba(91,155,200,0.35), rgba(155,133,212,0.35))',
          transition: 'width 60s linear',
        }} />
      </div>

      {/* Tap hint */}
      <div style={{
        position: 'absolute',
        bottom: '1.25rem',
        fontSize: '0.58rem',
        color: 'rgba(255,255,255,0.13)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Tap anywhere to wake
      </div>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,155,200,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
```

- [ ] **Step 2: Test sleep/wake manually**

Open `http://localhost:5173`. Wait 2 minutes (or temporarily set `SLEEP_TIMEOUT_MS = 5000` in App.jsx to test quickly). The sleep screen should fade in. Tap anywhere — it should fade back to the dashboard.

- [ ] **Step 3: Restore sleep timeout**

Ensure `SLEEP_TIMEOUT_MS = 2 * 60 * 1000` in App.jsx.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/SleepScreen.jsx
git commit -m "feat: SleepScreen — dark clock overlay with progress bar and tap-to-wake"
```

---

## Task 12: WebSocket Hook

**Files:**
- Create: `client/src/hooks/useWebSocket.js`
- Modify: `client/src/components/BentoGrid.jsx` (create stub)

- [ ] **Step 1: Create client/src/hooks/useWebSocket.js**

```js
import { useEffect, useRef, useCallback } from 'react';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
const MAX_BACKOFF_MS = 30_000;

export function useWebSocket(onMessage) {
  const socketRef = useRef(null);
  const attemptsRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      attemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        onMessageRef.current(msg);
      } catch {}
    };

    ws.onclose = () => {
      const delay = Math.min(1000 * 2 ** attemptsRef.current, MAX_BACKOFF_MS);
      attemptsRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.close();
    };
  }, [connect]);
}
```

- [ ] **Step 2: Create stub client/src/components/BentoGrid.jsx**

```jsx
import { useWebSocket } from '../hooks/useWebSocket.js';

export default function BentoGrid({ linearData, setLinearData }) {
  useWebSocket((msg) => {
    if (msg.type === 'integration' && msg.source === 'linear') {
      setLinearData(msg.data);
    }
  });

  return (
    <div className="bento">
      {/* widgets added in subsequent tasks */}
    </div>
  );
}
```

- [ ] **Step 3: Verify WebSocket connects**

Open browser devtools → Network → WS tab. Connect to `http://localhost:5173`. You should see a WebSocket connection to `/ws` established. When the server sends Linear data, it should appear in the frames.

- [ ] **Step 4: Commit**

```bash
git add client/src/hooks/useWebSocket.js client/src/components/BentoGrid.jsx
git commit -m "feat: WebSocket hook — auto-reconnect with exponential backoff"
```

---

## Task 13: ClockCard + ProgressPie

**Files:**
- Create: `client/src/components/ClockCard.jsx`
- Create: `client/src/components/ProgressPie.jsx`
- Modify: `client/src/components/BentoGrid.jsx`

- [ ] **Step 1: Create client/src/components/ClockCard.jsx**

```jsx
import { useState, useEffect } from 'react';
import { formatTime, formatDateLabel } from '../utils/time.js';

export default function ClockCard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card" style={{
      background: 'linear-gradient(145deg, #eef5fc, #ddeef9)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{
        fontSize: '2rem', fontWeight: 300,
        letterSpacing: '0.04em', color: 'var(--blue-dark)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatTime(now)}
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--blue)', marginTop: '0.3rem' }}>
        {formatDateLabel(now)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create client/src/components/ProgressPie.jsx**

```jsx
/**
 * Reusable SVG donut chart.
 * Props:
 *   progress  0–1 fraction filled
 *   color     stroke color for filled arc
 *   bgColor   stroke color for unfilled arc
 *   label     large text (e.g. "58%")
 *   sublabel  small text below label
 */
export default function ProgressPie({ progress, color, bgColor, label, sublabel }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <div className="card">
      <div className="card-label">{sublabel}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <svg width="58" height="58" viewBox="0 0 60 60" style={{ flexShrink: 0, overflow: 'visible' }}>
          <circle cx="30" cy="30" r={radius} fill="none" stroke={bgColor} strokeWidth="8" />
          <circle
            cx="30" cy="30" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
          />
          <circle cx="30" cy="30" r="9" fill="white" />
        </svg>
        <div>
          <div style={{ fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add ClockCard + ProgressPies to BentoGrid**

```jsx
import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { dayProgress, weekProgress } from '../utils/time.js';
import ClockCard from './ClockCard.jsx';
import ProgressPie from './ProgressPie.jsx';

export default function BentoGrid({ linearData, setLinearData }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useWebSocket((msg) => {
    if (msg.type === 'integration' && msg.source === 'linear') {
      setLinearData(msg.data);
    }
  });

  return (
    <div className="bento">
      {/* Row 1, col 1: Linear — spans 2 rows (added in Task 15) */}
      <div className="card" style={{ gridColumn: 1, gridRow: '1 / 3' }}>
        <div className="card-label">⬡ Linear</div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>Loading…</p>
      </div>

      {/* Row 1, col 2 */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <ProgressPie
          progress={dayProgress(now)}
          color="var(--blue)"
          bgColor="var(--blue-light)"
          label={`${Math.round(dayProgress(now) * 100)}%`}
          sublabel="Today"
        />
      </div>

      {/* Row 1, col 3 */}
      <div style={{ gridColumn: 3, gridRow: 1 }}>
        <ProgressPie
          progress={weekProgress(now)}
          color="var(--lav)"
          bgColor="var(--lav-light)"
          label={`${Math.round(weekProgress(now) * 100)}%`}
          sublabel="This Week"
        />
      </div>

      {/* Row 1, col 4 */}
      <div style={{ gridColumn: 4, gridRow: 1 }}>
        <ClockCard />
      </div>

      {/* Row 2, col 2-3: Goals placeholder (Task 16) */}
      <div className="card" style={{ gridColumn: '2 / 4', gridRow: 2 }}>
        <div className="card-label">◎ This Week's Goals</div>
      </div>

      {/* Row 2, col 4: Streak placeholder (Task 17) */}
      <div className="card" style={{ gridColumn: 4, gridRow: 2 }}>
        <div className="card-label">Streak</div>
      </div>

      {/* Row 3, col 1-3: Ratings chart placeholder (Task 17) */}
      <div className="card" style={{ gridColumn: '1 / 4', gridRow: 3 }}>
        <div className="card-label">◈ Weekly Ratings</div>
      </div>

      {/* Row 3, col 4: Integrations placeholder (Task 18) */}
      <div className="card" style={{ gridColumn: 4, gridRow: 3 }}>
        <div className="card-label">⚡ Integrations</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173`. You should see:
- A bento grid with placeholder cards
- Clock card showing current time (updates every second)
- Two donut charts showing day and week progress percentages

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ClockCard.jsx client/src/components/ProgressPie.jsx client/src/components/BentoGrid.jsx
git commit -m "feat: ClockCard + ProgressPie donut charts — day and week progress"
```

---

## Task 14: LinearWidget

**Files:**
- Create: `client/src/components/LinearWidget.jsx`
- Modify: `client/src/components/BentoGrid.jsx`

- [ ] **Step 1: Create client/src/components/LinearWidget.jsx**

```jsx
function IssueItem({ issue, variant }) {
  const borderColor = variant === 'active' ? 'var(--blue)' : variant === 'overdue' ? 'var(--lav)' : 'transparent';
  const bg = variant === 'active' ? 'var(--blue-light)' : variant === 'overdue' ? 'var(--lav-light)' : 'rgba(0,0,0,0.02)';
  const dotColor = variant === 'active' ? 'var(--blue)' : variant === 'overdue' ? 'var(--lav)' : '#d0d0d8';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.55rem',
      padding: '0.5rem 0.6rem', borderRadius: '10px',
      background: bg,
      marginBottom: '0.3rem',
      opacity: variant === 'upcoming' ? 0.6 : 1,
    }}>
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: dotColor, marginTop: '5px', flexShrink: 0,
      }} />
      <div>
        <div style={{ fontSize: '0.77rem', fontWeight: 500, lineHeight: 1.35, color: 'var(--text)' }}>
          {issue.title}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-sub)', marginTop: '0.1rem' }}>
          {issue.identifier}
          {issue.dueDate && ` · due ${issue.dueDate}`}
        </div>
      </div>
    </div>
  );
}

function Section({ label, issues, variant }) {
  if (!issues?.length) return null;
  return (
    <>
      <div style={{
        fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'var(--text-sub)', opacity: 0.6,
        margin: '0.7rem 0 0.4rem 0.1rem',
      }}>
        {label}
      </div>
      {issues.map(issue => (
        <IssueItem key={issue.id} issue={issue} variant={variant} />
      ))}
    </>
  );
}

export default function LinearWidget({ data }) {
  const lastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  return (
    <div className="card" style={{
      gridColumn: 1, gridRow: '1 / 3',
      overflowY: 'auto',
      background: 'linear-gradient(145deg, #fff 60%, #eef6ff)',
    }}>
      {/* Blue ambient blob */}
      <div style={{
        position: 'absolute', width: '180px', height: '180px', borderRadius: '50%',
        background: 'var(--blue-light)', top: '-60px', right: '-60px',
        filter: 'blur(40px)', opacity: 0.6, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="card-label">⬡ Linear</div>
        {lastUpdated && (
          <div style={{ fontSize: '0.55rem', color: 'var(--text-sub)', opacity: 0.5 }}>
            {lastUpdated}
          </div>
        )}
      </div>

      {!data && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Connecting…</p>
      )}

      {data && (
        <>
          <Section label="In Progress" issues={data.inProgress} variant="active" />
          <Section label="Overdue" issues={data.overdue} variant="overdue" />
          <Section label="Upcoming" issues={data.upcoming} variant="upcoming" />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace Linear placeholder in BentoGrid**

In `client/src/components/BentoGrid.jsx`, add the import at the top:
```jsx
import LinearWidget from './LinearWidget.jsx';
```

Replace the Linear placeholder div:
```jsx
{/* OLD: */}
<div className="card" style={{ gridColumn: 1, gridRow: '1 / 3' }}>
  <div className="card-label">⬡ Linear</div>
  <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>Loading…</p>
</div>

{/* NEW: */}
<LinearWidget data={linearData} />
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:5173`. The Linear widget should either show "Connecting…" or your actual Linear tasks if `LINEAR_API_KEY` is set in `.env` and the server is running. After 30 seconds (poll interval), it refreshes.

To force an immediate refresh: `curl -X POST http://localhost:3001/api/integrations/linear/refresh`

- [ ] **Step 4: Commit**

```bash
git add client/src/components/LinearWidget.jsx client/src/components/BentoGrid.jsx
git commit -m "feat: LinearWidget — in progress / overdue / upcoming sections, live via WebSocket"
```

---

## Task 15: GoalsWidget + useGoals Hook

**Files:**
- Create: `client/src/hooks/useGoals.js`
- Create: `client/src/components/GoalsWidget.jsx`
- Modify: `client/src/components/BentoGrid.jsx`

- [ ] **Step 1: Create client/src/hooks/useGoals.js**

```js
import { useState, useEffect, useCallback } from 'react';
import { getWeekStart } from '../utils/time.js';

export function useGoals() {
  const [goals, setGoals] = useState([]);
  const weekStart = getWeekStart();

  const fetchGoals = useCallback(async () => {
    const res = await fetch(`/api/goals?week=${weekStart}`);
    const data = await res.json();
    setGoals(data);
  }, [weekStart]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  async function addGoal(title) {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start: weekStart, title }),
    });
    const goal = await res.json();
    setGoals(prev => [...prev, goal]);
  }

  async function toggleGoal(id, completed) {
    // Optimistic update
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: completed ? 1 : 0 } : g));
    await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: completed ? 1 : 0 }),
    });
  }

  async function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id));
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
  }

  return { goals, addGoal, toggleGoal, deleteGoal };
}
```

- [ ] **Step 2: Create client/src/components/GoalsWidget.jsx**

```jsx
import { useState } from 'react';
import { useGoals } from '../hooks/useGoals.js';

export default function GoalsWidget() {
  const { goals, addGoal, toggleGoal, deleteGoal } = useGoals();
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const completed = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? completed / goals.length : 0;

  async function handleAdd(e) {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;
    await addGoal(title);
    setInputValue('');
    setShowInput(false);
  }

  return (
    <div className="card" style={{ gridColumn: '2 / 4', gridRow: 2, position: 'relative' }}>
      {/* Lavender blob */}
      <div style={{
        position: 'absolute', width: '120px', height: '120px', borderRadius: '50%',
        background: 'var(--lav-light)', bottom: '-40px', right: 0,
        filter: 'blur(35px)', opacity: 0.7, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-label">◎ This Week's Goals</div>
        <button
          onClick={() => setShowInput(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 600, padding: '0 0.2rem',
          }}
        >
          {showInput ? '✕' : '+ add'}
        </button>
      </div>

      {showInput && (
        <form onSubmit={handleAdd} style={{ marginBottom: '0.6rem' }}>
          <input
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="New goal…"
            style={{
              width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px',
              border: '1.5px solid var(--blue-light)', fontSize: '0.77rem',
              fontFamily: 'var(--font)', outline: 'none', color: 'var(--text)',
            }}
          />
        </form>
      )}

      {goals.length === 0 && !showInput && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>No goals yet — tap + add</p>
      )}

      {goals.map(goal => (
        <div
          key={goal.id}
          onClick={() => toggleGoal(goal.id, !goal.completed)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.4rem 0', borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '17px', height: '17px', borderRadius: '50%', flexShrink: 0,
            background: goal.completed ? 'var(--blue)' : 'transparent',
            border: goal.completed ? 'none' : '2px solid #ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {goal.completed && <span style={{ color: 'white', fontSize: '0.55rem', fontWeight: 800 }}>✓</span>}
          </div>
          <span style={{
            fontSize: '0.77rem', color: 'var(--text)',
            textDecoration: goal.completed ? 'line-through' : 'none',
            opacity: goal.completed ? 0.4 : 1,
            flex: 1,
          }}>
            {goal.title}
          </span>
        </div>
      ))}

      {goals.length > 0 && (
        <div style={{ marginTop: '0.7rem', height: '4px', background: 'var(--blue-light)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, var(--blue), var(--blue-mid))',
            borderRadius: '99px', transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update BentoGrid to use GoalsWidget**

Add import: `import GoalsWidget from './GoalsWidget.jsx';`

Replace the Goals placeholder:
```jsx
{/* OLD: */}
<div className="card" style={{ gridColumn: '2 / 4', gridRow: 2 }}>
  <div className="card-label">◎ This Week's Goals</div>
</div>

{/* NEW: */}
<GoalsWidget />
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173`. Tap "+ add", type a goal, press Enter. It should appear in the list. Tap the circle to toggle it complete. Progress bar should update.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useGoals.js client/src/components/GoalsWidget.jsx client/src/components/BentoGrid.jsx
git commit -m "feat: GoalsWidget — weekly checklist with add, toggle, progress bar"
```

---

## Task 16: RatingsChart + useRatings + StreakCard

**Files:**
- Create: `client/src/hooks/useRatings.js`
- Create: `client/src/components/RatingsChart.jsx`
- Create: `client/src/components/StreakCard.jsx`
- Modify: `client/src/components/BentoGrid.jsx`

- [ ] **Step 1: Create client/src/hooks/useRatings.js**

```js
import { useState, useEffect, useCallback } from 'react';

export function useRatings(limit = 6) {
  const [ratings, setRatings] = useState([]);

  const fetchRatings = useCallback(async () => {
    const res = await fetch(`/api/ratings?limit=${limit}`);
    const data = await res.json();
    setRatings(data);
  }, [limit]);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  async function addRating(week_start, rating, notes = '') {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start, rating, notes }),
    });
    const row = await res.json();
    setRatings(prev => [row, ...prev].slice(0, limit));
  }

  return { ratings, addRating };
}
```

- [ ] **Step 2: Create client/src/components/RatingsChart.jsx**

```jsx
import { useRef, useEffect } from 'react';
import { getWeekStart } from '../utils/time.js';

function formatWeekLabel(weekStart) {
  const d = new Date(weekStart + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RatingsChart({ ratings }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // ratings comes in newest-first; we want oldest-first for the chart
  const sorted = [...ratings].reverse();
  const currentWeek = getWeekStart();
  const hasCurrentWeek = sorted.some(r => r.week_start === currentWeek);

  // Add a placeholder for current week if not yet rated
  const chartData = hasCurrentWeek
    ? sorted
    : [...sorted, { week_start: currentWeek, rating: null }];

  const MIN = 1, MAX = 10;

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container || chartData.length < 2) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // Clear previous
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const toX = (i) => (i / (chartData.length - 1)) * W;
    const toY = (r) => H - ((r - MIN) / (MAX - MIN)) * H;

    const solidPoints = chartData
      .map((d, i) => d.rating !== null ? { x: toX(i), y: toY(d.rating), i } : null)
      .filter(Boolean);

    // Draw grid lines at 2, 4, 6, 8, 10
    for (const v of [2, 4, 6, 8, 10]) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0); line.setAttribute('x2', W);
      line.setAttribute('y1', toY(v)); line.setAttribute('y2', toY(v));
      line.setAttribute('stroke', 'rgba(0,0,0,0.045)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }

    // Draw connecting lines between solid points
    for (let k = 0; k < solidPoints.length - 1; k++) {
      const a = solidPoints[k], b = solidPoints[k + 1];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.setAttribute('stroke', 'var(--blue-mid)');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    }

    // Dashed line to current week placeholder if unrated
    if (!hasCurrentWeek && solidPoints.length > 0) {
      const last = solidPoints[solidPoints.length - 1];
      const ghostX = toX(chartData.length - 1);
      const ghostY = toY(5);
      const dashed = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      dashed.setAttribute('x1', last.x); dashed.setAttribute('y1', last.y);
      dashed.setAttribute('x2', ghostX); dashed.setAttribute('y2', ghostY);
      dashed.setAttribute('stroke', 'var(--lav-mid)');
      dashed.setAttribute('stroke-width', '1.5');
      dashed.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(dashed);

      const ghostCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ghostCircle.setAttribute('cx', ghostX); ghostCircle.setAttribute('cy', ghostY);
      ghostCircle.setAttribute('r', '5');
      ghostCircle.setAttribute('fill', 'var(--lav-light)');
      ghostCircle.setAttribute('stroke', 'var(--lav-mid)');
      ghostCircle.setAttribute('stroke-width', '2');
      ghostCircle.setAttribute('stroke-dasharray', '3 2');
      svg.appendChild(ghostCircle);
    }

    // Draw solid nodes + labels
    for (const p of solidPoints) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', p.x); glow.setAttribute('cy', p.y);
      glow.setAttribute('r', '8');
      glow.setAttribute('fill', 'var(--blue-light)');
      glow.setAttribute('opacity', '0.5');
      svg.appendChild(glow);

      const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      node.setAttribute('cx', p.x); node.setAttribute('cy', p.y);
      node.setAttribute('r', '4.5');
      node.setAttribute('fill', 'white');
      node.setAttribute('stroke', 'var(--blue)');
      node.setAttribute('stroke-width', '2');
      svg.appendChild(node);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', p.x); label.setAttribute('y', p.y - 11);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '9');
      label.setAttribute('font-weight', '600');
      label.setAttribute('fill', 'var(--blue)');
      label.setAttribute('font-family', 'var(--font)');
      label.textContent = chartData[p.i].rating;
      svg.appendChild(label);
    }
  }, [ratings, hasCurrentWeek]);

  if (ratings.length === 0) {
    return (
      <div className="card" style={{ gridColumn: '1 / 4', gridRow: 3 }}>
        <div className="card-label">◈ Weekly Ratings</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>No ratings yet. Log your first week!</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ gridColumn: '1 / 4', gridRow: 3 }}>
      <div className="card-label">◈ Weekly Ratings</div>

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem' }}>
        {/* Y axis */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '1.4rem', width: '1.4rem' }}>
          {[10, 8, 6, 4, 2].map(v => (
            <span key={v} style={{ fontSize: '0.55rem', color: '#ccc', textAlign: 'right' }}>{v}</span>
          ))}
        </div>

        {/* Plot area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div ref={containerRef} style={{ flex: 1, position: 'relative', height: '80px' }}>
            <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} />
          </div>

          {/* X axis labels */}
          <div style={{ display: 'flex' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', fontSize: '0.55rem',
                color: d.rating === null ? 'var(--lav)' : '#bbb',
                fontWeight: d.rating === null ? 600 : 400,
              }}>
                {d.rating === null ? 'This week' : formatWeekLabel(d.week_start)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create client/src/components/StreakCard.jsx**

```jsx
import { useRatings } from '../hooks/useRatings.js';
import { computeStreak } from '../utils/time.js';

export default function StreakCard() {
  const { ratings, addRating } = useRatings(12);
  const streak = computeStreak(ratings);

  return (
    <div className="card" style={{
      gridColumn: 4, gridRow: 2,
      background: 'linear-gradient(145deg, var(--lav-light), #ddd8f5)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{
        fontSize: '2.4rem', fontWeight: 800,
        color: 'var(--lav)', letterSpacing: '-0.04em',
      }}>
        {streak}
      </div>
      <div style={{
        fontSize: '0.62rem', color: 'var(--lav)', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginTop: '0.2rem', opacity: 0.75,
      }}>
        Week Streak
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update BentoGrid to use RatingsChart and StreakCard**

Add imports:
```jsx
import RatingsChart from './RatingsChart.jsx';
import StreakCard from './StreakCard.jsx';
```

Replace the Ratings and Streak placeholders:
```jsx
{/* OLD: */}
<div className="card" style={{ gridColumn: '1 / 4', gridRow: 3 }}>
  <div className="card-label">◈ Weekly Ratings</div>
</div>
<div className="card" style={{ gridColumn: 4, gridRow: 2 }}>
  <div className="card-label">Streak</div>
</div>

{/* NEW: */}
<RatingsChart ratings={ratings} />
<StreakCard />
```

Also fetch ratings at the BentoGrid level and pass them:

```jsx
import { useRatings } from '../hooks/useRatings.js';
// ... inside BentoGrid:
const { ratings } = useRatings(6);
```

- [ ] **Step 5: Verify in browser**

The ratings chart should show "No ratings yet." message. To test it with data, add a rating via API:

```bash
curl -X POST http://localhost:3001/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"week_start":"2026-05-19","rating":8,"notes":"Good week"}'

curl -X POST http://localhost:3001/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"week_start":"2026-05-12","rating":6}'
```

Refresh the browser. The chart should show nodes connected by lines, with a dashed node for the current unrated week.

- [ ] **Step 6: Commit**

```bash
git add client/src/hooks/useRatings.js client/src/components/RatingsChart.jsx client/src/components/StreakCard.jsx client/src/components/BentoGrid.jsx
git commit -m "feat: RatingsChart XY graph + StreakCard + useRatings hook"
```

---

## Task 17: IntegrationsCard

**Files:**
- Create: `client/src/components/IntegrationsCard.jsx`
- Modify: `client/src/components/BentoGrid.jsx`

- [ ] **Step 1: Create client/src/components/IntegrationsCard.jsx**

```jsx
import { useState, useEffect } from 'react';

const COMING_SOON = ['Slack', 'Messenger'];

export default function IntegrationsCard() {
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then(setIntegrations)
      .catch(() => {});
  }, []);

  return (
    <div className="card" style={{
      gridColumn: 4, gridRow: 3,
      display: 'flex', flexDirection: 'column', gap: '0.45rem',
    }}>
      <div className="card-label">⚡ Integrations</div>

      {integrations.map(({ name, status }) => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.45rem 0.6rem', borderRadius: '10px',
          background: 'var(--blue-light)',
          fontSize: '0.72rem', fontWeight: 500, color: 'var(--blue-dark)',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: status === 'active' ? 'var(--blue)' : '#f4a0a0',
          }} />
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </div>
      ))}

      {COMING_SOON.map(name => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.45rem 0.6rem', borderRadius: '10px',
          background: '#f6f6f8',
          fontSize: '0.72rem', fontWeight: 500, color: '#bbb',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ddd', flexShrink: 0 }} />
          {name}
        </div>
      ))}

      <div style={{
        marginTop: 'auto', fontSize: '0.62rem',
        color: 'var(--lav)', textAlign: 'center', paddingTop: '0.4rem',
      }}>
        + add integration
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace placeholder in BentoGrid**

Add import: `import IntegrationsCard from './IntegrationsCard.jsx';`

Replace:
```jsx
{/* OLD: */}
<div className="card" style={{ gridColumn: 4, gridRow: 3 }}>
  <div className="card-label">⚡ Integrations</div>
</div>

{/* NEW: */}
<IntegrationsCard />
```

- [ ] **Step 3: Verify in browser**

The integrations card should show "Linear" with a blue dot (active) and "Slack", "Messenger" grayed out.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/IntegrationsCard.jsx client/src/components/BentoGrid.jsx
git commit -m "feat: IntegrationsCard — live status + coming-soon list"
```

---

## Task 18: Production Build + End-to-End Verification

**Files:**
- No new files — verify everything works together

- [ ] **Step 1: Build the React client**

```bash
npm run build
```

Expected: `client/dist/` is created with no errors.

- [ ] **Step 2: Start server in production mode**

```bash
NODE_ENV=production node server/index.js
```

- [ ] **Step 3: Open the dashboard at http://localhost:3001**

Verify all widgets load:
- [ ] Clock shows current time and updates
- [ ] Day + week progress pies show correct percentages
- [ ] Linear widget shows your actual tasks (if `LINEAR_API_KEY` is set)
- [ ] Goals widget loads with empty state; can add a goal and toggle it
- [ ] Ratings chart shows "No ratings yet" or actual data if seeded
- [ ] Streak card shows 0 or actual streak
- [ ] Integrations card shows Linear active

- [ ] **Step 4: Test sleep/wake**

Wait 2 minutes idle. Sleep screen should fade in. Tap anywhere — dashboard should fade back in.

- [ ] **Step 5: Test on iPad Safari**

Navigate to `http://localhost:3001` on iPad (while on same network or via Tailscale/Railway URL). Verify layout fits without horizontal scroll.

- [ ] **Step 6: Run full test suite one last time**

```bash
npm test
```

Expected: all server tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: production build verified — full dashboard working end-to-end"
```

---

## Task 19: Deploy to Railway

- [ ] **Step 1: Push repo to GitHub**

Create a new repo on GitHub (e.g. `heng`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/heng.git
git push -u origin main
```

- [ ] **Step 2: Create Railway project**

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your `heng` repo
3. Railway will detect `railway.json` and use it automatically

- [ ] **Step 3: Add a persistent volume**

In Railway dashboard: your service → **Volumes** → Add Volume
- Mount path: `/data`
- This ensures SQLite survives redeploys

- [ ] **Step 4: Set environment variables**

In Railway dashboard: your service → **Variables** → Add:
```
LINEAR_API_KEY = lin_api_your_actual_key
DB_PATH        = /data/dashboard.db
NODE_ENV       = production
```

(Railway sets `PORT` automatically — no need to add it.)

- [ ] **Step 5: Trigger a deploy and verify**

Railway auto-deploys on push. Check the deploy logs:
```
Server running on http://localhost:XXXX
```

Click the Railway-generated URL (e.g. `heng.up.railway.app`). Verify the dashboard loads.

- [ ] **Step 6: Open on iPad**

Navigate to your Railway URL in Safari on your iPad. Add to home screen (Share → Add to Home Screen) for a full-screen PWA experience. Set iPad auto-lock to **Never** in Settings → Display & Brightness.

- [ ] **Step 7: Final commit**

```bash
git add railway.json
git commit -m "chore: Railway deployment — persistent volume, env vars documented"
git push
```

---

## All Tests

Run the full test suite at any time:

```bash
npm test
```

Individual suites:
```bash
npx vitest run server/tests/db.test.js
npx vitest run server/tests/goals.test.js
npx vitest run server/tests/ratings.test.js
npx vitest run server/tests/loader.test.js
npx vitest run server/tests/linear.test.js
```
