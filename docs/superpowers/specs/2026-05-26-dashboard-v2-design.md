# Dashboard v2 — Design Spec
**Date:** 2026-05-26  
**Status:** Approved

---

## Overview

A redesign of the personal stats dashboard. Linear tasks become the dominant element (~80% of the screen), grouped by project with per-project progress bars. The sidebar is simplified to Clock, Goals (with donut), and Ratings. Removed: Today %, Week %, Streak, Integrations cards.

---

## Layout

Two-column CSS grid: `grid-template-columns: 4fr 1fr`, full viewport height, no scrolling.

```
┌─────────────────────────────────────┬──────────────┐
│                                     │   Clock      │
│   Linear Panel                      ├──────────────┤
│   3 project columns, side-by-side   │   Goals      │
│   (each: name, progress bar,        │   (donut +   │
│    issue list, check to complete)   │    list)     │
│                                     ├──────────────┤
│                                     │   Ratings    │
└─────────────────────────────────────┴──────────────┘
```

---

## Linear Panel

### Data Fetching

Fetch **all non-cancelled issues** in a single query. Each issue includes its `project { id, name, color }`. Group client-side by project.

- Filter: `state.type NOT IN ['cancelled']`
- Fields per issue: `id, title, identifier, dueDate, state { name, type }, project { id, name, color }`
- Polling interval: 30s (unchanged)
- No assignee filter — all issues regardless of who they're assigned to

### Project grouping

Auto-detected from returned data. Each unique `project.id` becomes a column. Columns rendered in the order projects first appear in the response. Issues with no project are grouped under a "General" column. If there are more than 4 projects, only the 4 with the most open issues are shown.

### Per-project display

- **Header**: colored dot (project.color) + project name
- **Stat line**: `X / Y done · Z%` where X = completed issues, Y = total non-cancelled issues
- **Progress bar**: 12px tall, rounded, gradient fill using project color
- **Issue list**: only non-completed issues shown (state.type ≠ 'completed'). Each row:
  - Check circle (tap → marks done in Linear)
  - Title (truncated with `text-overflow: ellipsis`, single line)
  - Issue identifier + optional due date
  - Status dot: blue = in progress, lavender = overdue, grey = todo

### Mark as done

Tapping the check circle on an issue:
1. Optimistic UI: immediately show the issue as struck-through / faded, then remove from list
2. Server call: `POST /api/linear/complete/:issueId`
3. Server looks up the team's "Done" workflow state (first state with `type === 'completed'`) and calls Linear's `issueUpdate` mutation
4. On error: revert the optimistic update, show a subtle error indicator

New server endpoint: `POST /api/linear/complete/:issueId` — finds the Done state for the issue's team and applies it via Linear API.

---

## Sidebar

### Clock Card

Unchanged — live digital clock, date label, blue gradient background.

### Goals Card

**Week definition:** Sunday → Saturday (changed from Monday → Sunday).

**Donut chart**: centered at top of card, SVG donut showing completed/total with count inside (e.g. `2/4`).

**Goals list**: below the donut. Each goal: checkbox circle + title (truncated).

**Carryover**: uncompleted goals from the previous week automatically appear in the current week's list. No label or visual distinction — they just live in the current week. Implementation: when fetching goals for `week=current`, the server also returns incomplete goals from any prior week.

**Add goal**: `+ add goal` tap target at the bottom of the list opens an inline text input.

### Ratings Card

- Last 3 weeks shown as horizontal bar rows: week label + 10px bar + numeric value
- `+ Rate this week` button → expands an inline input: number 1–10 (required) + optional notes text field + submit

---

## Backend Changes

### 1. Linear integration module (`server/integrations/linear.js`)

Replace `viewer.assignedIssues()` with a query for all non-cancelled issues including project info. New return shape:

```js
{
  projects: [
    {
      id: 'proj-id',
      name: 'Heng Dashboard',
      color: '#5b9bc8',
      totalIssues: 20,
      completedIssues: 12,
      openIssues: [
        { id, title, identifier, dueDate, stateName, stateType }
      ]
    }
  ],
  lastUpdated: '2026-05-26T...'
}
```

### 2. New REST endpoint

`POST /api/linear/complete/:issueId`
- Reads `LINEAR_API_KEY` from env / integrations_config
- Fetches the issue to get its team ID
- Fetches workflow states for that team, finds first with `type === 'completed'`
- Calls `issueUpdate(issueId, { stateId })` via Linear SDK
- Returns `{ ok: true }` or `{ error: '...' }`
- If no `type === 'completed'` state exists for the team, returns `{ error: 'No completed state found for team' }` (HTTP 422) and the client reverts the optimistic update

### 3. Goals week start

Change `getWeekStart()` in `client/src/utils/time.js` to use **Sunday** as week start (day 0, no offset needed):

```js
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d.toISOString().split('T')[0];
}
```

### 4. Goals carryover

`GET /api/goals?week=YYYY-MM-DD` — extend to also return incomplete goals from prior weeks. Server fetches:
- All goals where `week_start = requested_week` (any completion state)
- All goals where `week_start < requested_week AND week_start >= (requested_week − 4 weeks) AND completed = 0`

Carryover is capped at 4 weeks back to prevent indefinite accumulation. Returns them merged in a single array (carryover goals first, then current week goals, ordered by id).

---

## Frontend Changes

### Removed components

- `ProgressPie.jsx` — no longer used (delete or keep unused)
- `StreakCard.jsx` — removed
- `IntegrationsCard.jsx` — removed
- `RatingsChart.jsx` — replaced with simpler bar row design inline in sidebar

### New/updated components

- `LinearWidget.jsx` — full rewrite: project columns layout, progress bars, mark-done
- `GoalsWidget.jsx` — add donut above list; change week logic to Sunday start; add carryover fetch
- `BentoGrid.jsx` — new 4fr/1fr grid, remove old widgets, add inline ratings bar rows
- `RatingsSidebar.jsx` — new component: bar rows + "+ Rate this week" inline form

### CSS

Grid changes to `grid-template-columns: 4fr 1fr`. Remove `.bento` multi-row grid. Linear panel fills left column with an internal 3-column CSS grid for projects.

---

## Error Handling

- **Mark done fails**: revert optimistic update, show a small red dot on the issue for 3s
- **Linear fetch fails**: show last known data with "last updated X ago" timestamp (unchanged)
- **Goals carryover fetch**: if prior-week goals fail to load, silently show only current-week goals

---

## Not in scope

- Editing or deleting Linear issues beyond marking done
- More than one "Done" state per team (use first `type === 'completed'` state found)
- Pagination of Linear issues (assume < 100 issues per project)
- Ratings history beyond last 3 in the sidebar (XY chart removed)
