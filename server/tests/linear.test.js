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
