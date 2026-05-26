# Personal Stats Dashboard — Design Spec
**Date:** 2026-05-26  
**Status:** Approved

---

## Overview

A personal stats dashboard — always-on iPad display with sleep/wake behavior, accessible on desktop too. Surfaces Linear tasks, weekly goals, and week-over-week ratings in a clean bento-grid UI. Built to be extended with new integrations (Slack, Messenger, etc.) over time.

---

## Goals & Priorities

1. **Linear task tracking** — in progress, upcoming, overdue, live updates
2. **Weekly goals** — set goals for the week, mark complete, track progress
3. **Week ratings** — log a 1–10 rating each week, visualize history
4. **Extensible integrations** — adding new data sources requires minimal effort
5. **Always-on iPad display** — sleep/wake states, works on desktop too

Non-goals (explicit): Health/Screen Time integration (deferred), native iOS app, mobile phone layout.

---

## Platform & Hosting

**Frontend:** React (Vite), tablet-optimized layout, also usable on desktop.

**Backend:** Node.js + Express, deployed to **Railway**.
- Railway connects to a GitHub repo, auto-deploys on push
- Environment variables (API keys) set in Railway dashboard — never in code
- Single deployment unit: Express serves the React build as static files in production

**Database:** SQLite via `better-sqlite3`. Stored on a **Railway persistent volume** (mounted at `/data/dashboard.db`) — required so data survives redeploys and container restarts. Railway persistent volumes are configured in the Railway dashboard and survive the container lifecycle. Sufficient for personal-scale data with no concurrent write concerns.

**Connectivity:** Accessible from any network via Railway's public URL. No VPN required.

---

## Architecture

```
React Frontend (Vite)
  │
  ├── REST API calls (goals, ratings, config)
  └── WebSocket connection (live integration updates)
        │
Express Server (Node.js) — hosted on Railway
  ├── REST API          → Goals CRUD, Ratings CRUD, Config
  ├── WebSocket Hub     → Broadcasts integration updates to all clients
  ├── Integration Loader → Auto-loads all files in integrations/
  │     ├── linear.js  ✅ (polls Linear API, pushes via WebSocket)
  │     ├── slack.js   (future)
  │     └── messenger.js (future)
  └── Static file server → serves React build in production
        │
SQLite Database
  ├── weekly_goals
  ├── week_ratings
  └── integrations_config (API keys, tokens — stored server-side only)
        │
External APIs
  └── Linear API (others: future)
```

---

## Integration Module Pattern

Each integration is a self-contained file in `integrations/`. The server scans and loads all files in that directory on startup — adding a new integration requires no changes to server code.

Each module exports:

```js
export default {
  name: 'linear',           // identifier
  interval: 30_000,         // poll every 30s (or null if webhook-driven)
  async fetch(config) { },  // returns structured data to broadcast
  // optional: webhook handler
  async onWebhook(payload) { }
}
```

The server calls `fetch()` on the interval, broadcasts the result to all WebSocket clients as `{ type: 'integration', source: 'linear', data: {...} }`. React components subscribe to the relevant `source` and update.

API keys are loaded from `integrations_config` in SQLite (set via a simple admin UI or direct DB write on first setup).

---

## Data Model

### `weekly_goals`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto-increment |
| week_start | TEXT | ISO date of Monday, e.g. `2026-05-25` |
| title | TEXT | goal description |
| completed | INTEGER | 0 or 1 |
| created_at | TEXT | ISO timestamp |

### `week_ratings`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto-increment |
| week_start | TEXT | ISO date of Monday |
| rating | INTEGER | 1–10 |
| notes | TEXT | optional reflection text |
| created_at | TEXT | ISO timestamp |

### `integrations_config`
| Column | Type | Notes |
|---|---|---|
| key | TEXT PK | e.g. `linear_api_key` |
| value | TEXT | encrypted at rest (future) |

---

## UI Design

### Visual Language
- **Theme:** Light mode, bento grid layout
- **Colors:** Blue primary (`#5b9bc8`), Lavender secondary (`#9b85d4`), white cards, warm off-white background (`#f2f0f8`)
- **Typography:** System font (`-apple-system`), clean Apple-like hierarchy
- **Cards:** White, 20px border-radius, soft shadow, subtle pastel gradient blobs

### Dashboard Layout (Bento Grid)

```
┌─────────────────────┬──────────┬──────────┬───────────┐
│                     │ Today %  │ Week %   │   Clock   │
│   Linear Tasks      │ pie chart│ pie chart│  14:47    │
│   (tall, dominant)  ├──────────┴──────────┤           │
│                     │   Weekly Goals      │  Streak   │
│                     │   checklist         │    12     │
├─────────────────────┴──────────┴──────────┴───────────┤
│  Weekly Ratings — XY chart (nodes + thin lines)        │  Integrations
│  Y axis: 1–10  ·  X axis: past 6 weeks                │  status card
└────────────────────────────────────────────────────────┘
```

### Linear Widget
- Sections: In Progress (blue highlight), Upcoming (muted), Overdue (lavender highlight)
- Each item: title + issue ID + relative due date
- Updates live via WebSocket

### Progress Pies
- Day: percentage of 24h elapsed (updates every minute)
- Week: percentage of Mon–Sun elapsed
- Donut chart, blue and lavender respectively

### Weekly Goals
- Checklist per week (tap to toggle complete)
- Thin progress bar showing X of N complete
- Goals are week-scoped — new week, new goals

### Week Ratings XY Chart
- Y axis: 1–10
- X axis: last 6 weeks
- Nodes at each rating, connected by thin lines
- Current week shown as dashed node (unfilled until rated)
- Rating label above each node

### Streak Card
- Counts consecutive weeks where a rating was logged
- Simple large number display

### Integrations Card
- Shows active integrations (green dot) and coming-soon ones (gray)
- "+ add integration" affordance for future

---

## Sleep / Wake Behavior

**Sleep:** After 2 minutes of no interaction, the dashboard fades to a dark screen showing:
- Large minimal clock (time only)
- Hairline progress bar at bottom (day progress, very dim)
- "Tap anywhere to wake" hint in tiny text

**Wake:** Any tap anywhere → instant fade back to full dashboard. Data refreshes on wake (REST fetch + WebSocket re-confirms state).

**iPad setup:** Set auto-lock to Never in iOS Settings. Dashboard runs in Safari as a full-screen PWA (added to home screen) or in a plain browser tab.

**WebSocket:** Connection stays open during sleep. Linear data is always current when the screen wakes.

---

## REST API Endpoints

```
GET  /api/goals?week=2026-05-25       list goals for a week
POST /api/goals                        create goal { week_start, title }
PUT  /api/goals/:id                    update { completed }
DEL  /api/goals/:id                    delete

GET  /api/ratings?limit=10            list recent ratings
POST /api/ratings                      create { week_start, rating, notes }
PUT  /api/ratings/:id                  update rating/notes

GET  /api/integrations                 list loaded integrations + status
POST /api/integrations/:name/refresh   trigger manual refresh
```

---

## WebSocket Protocol

Server → Client messages:

```json
{ "type": "integration", "source": "linear", "data": { ... } }
{ "type": "ping" }
```

Client → Server:

```json
{ "type": "pong" }
```

Clients reconnect automatically on disconnect (exponential backoff, max 30s).

---

## Error Handling

- **Linear API down:** Last known data shown with a subtle "last updated X ago" timestamp. No crash.
- **WebSocket disconnect:** Auto-reconnect with backoff. Dashboard stays functional using last received data.
- **Railway downtime:** iPad shows a connection error state. Data from last session not persisted client-side (acceptable for personal use).
- **Invalid ratings input:** Validated server-side (1–10 integer). Client enforces range in UI.

---

## Testing Approach

- **Unit tests:** Integration module `fetch()` functions tested in isolation with mocked API responses
- **API tests:** Express routes tested with `supertest` — goals and ratings CRUD
- **Manual:** Full sleep/wake cycle, Linear live updates, goal creation/completion on iPad Safari

No frontend unit tests for this phase — the UI is simple enough that manual testing on the device is more valuable than component tests.

---

## Deployment

1. Push repo to GitHub
2. Create Railway project → connect GitHub repo
3. Add a persistent volume in Railway, mount at `/data`
4. Set env vars in Railway: `LINEAR_API_KEY`, `NODE_ENV=production`, `PORT`, `DB_PATH=/data/dashboard.db`
5. Railway auto-builds and deploys on every push to `main`
6. Access dashboard via Railway-provided URL (e.g. `heng.up.railway.app`)

---

## Future Considerations

- Encryption of `integrations_config` values at rest
- Custom domain via Railway
- Slack integration (unread counts, DM mentions)
- Messenger integration
- HealthKit bridge via thin native iOS wrapper (already researched — viable via Capacitor)
- Weekly reflection modal (log notes alongside rating)
- PWA manifest for iPad home screen installation
