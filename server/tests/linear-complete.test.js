import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createDb, closeDb } from '../db.js';
import { createApp } from '../app.js';

const mockRawRequest = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: vi.fn().mockImplementation(() => ({
    client: { rawRequest: mockRawRequest },
  })),
}));

function makeStateNodes(nodes) {
  return { data: { issue: { team: { states: { nodes } } } } };
}

describe('POST /api/linear/complete/:issueId', () => {
  let db, app;

  beforeEach(() => {
    process.env.LINEAR_API_KEY = 'test-key';
    db = createDb(':memory:');
    app = createApp(db);
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.LINEAR_API_KEY;
    closeDb(db);
  });

  it('returns ok:true and calls issueUpdate mutation with done state id', async () => {
    mockRawRequest
      .mockResolvedValueOnce(makeStateNodes([
        { id: 'state-1', type: 'started' },
        { id: 'state-2', type: 'completed' },
      ]))
      .mockResolvedValueOnce({ data: { issueUpdate: { success: true } } });

    const res = await request(app).post('/api/linear/complete/issue-abc');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const mutationCall = mockRawRequest.mock.calls[1];
    expect(mutationCall[1]).toEqual({ id: 'issue-abc', stateId: 'state-2' });
  });

  it('returns 500 when no API key is configured', async () => {
    delete process.env.LINEAR_API_KEY;
    const res = await request(app).post('/api/linear/complete/issue-abc');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/API key/i);
  });

  it('returns 422 when no completed state exists for the team', async () => {
    mockRawRequest.mockResolvedValueOnce(makeStateNodes([
      { id: 'state-1', type: 'started' },
    ]));

    const res = await request(app).post('/api/linear/complete/issue-abc');
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/completed state/i);
  });
});
