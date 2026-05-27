import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createDb, closeDb } from '../db.js';
import { createApp } from '../app.js';

const mockIssueUpdate = vi.fn().mockResolvedValue({ success: true });
const mockStates = vi.fn().mockResolvedValue({
  nodes: [
    { id: 'state-1', name: 'In Progress', type: 'started' },
    { id: 'state-2', name: 'Done', type: 'completed' },
  ],
});

vi.mock('@linear/sdk', () => ({
  LinearClient: vi.fn().mockImplementation(() => ({
    issue: vi.fn().mockResolvedValue({
      team: Promise.resolve({ states: mockStates }),
    }),
    issueUpdate: mockIssueUpdate,
    client: { rawRequest: vi.fn() },
  })),
}));

describe('POST /api/linear/complete/:issueId', () => {
  let db, app;

  beforeEach(() => {
    process.env.LINEAR_API_KEY = 'test-key';
    db = createDb(':memory:');
    app = createApp(db);
    vi.clearAllMocks();
    mockStates.mockResolvedValue({
      nodes: [
        { id: 'state-1', name: 'In Progress', type: 'started' },
        { id: 'state-2', name: 'Done', type: 'completed' },
      ],
    });
    mockIssueUpdate.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    delete process.env.LINEAR_API_KEY;
    closeDb(db);
  });

  it('returns ok:true and calls issueUpdate with the done state id', async () => {
    const res = await request(app).post('/api/linear/complete/issue-abc');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockIssueUpdate).toHaveBeenCalledWith('issue-abc', { stateId: 'state-2' });
  });

  it('returns 500 when no API key is configured', async () => {
    delete process.env.LINEAR_API_KEY;
    const res = await request(app).post('/api/linear/complete/issue-abc');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/API key/i);
  });

  it('returns 422 when no completed state exists for the team', async () => {
    mockStates.mockResolvedValue({
      nodes: [{ id: 'state-1', name: 'In Progress', type: 'started' }],
    });
    const res = await request(app).post('/api/linear/complete/issue-abc');
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/completed state/i);
  });
});
