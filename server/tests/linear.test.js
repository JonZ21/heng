import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@linear/sdk', () => ({
  LinearClient: vi.fn().mockImplementation(() => ({
    client: {
      rawRequest: vi.fn().mockResolvedValue({
        data: {
          issues: {
            nodes: [
              {
                id: '1',
                title: 'Build WebSocket layer',
                identifier: 'ENG-142',
                dueDate: '2026-05-30',
                state: { name: 'In Progress', type: 'started' },
                project: { id: 'proj-1', name: 'Heng Dashboard', color: '#5b9bc8' },
              },
              {
                id: '2',
                title: 'Write tests',
                identifier: 'ENG-145',
                dueDate: null,
                state: { name: 'Todo', type: 'unstarted' },
                project: { id: 'proj-1', name: 'Heng Dashboard', color: '#5b9bc8' },
              },
              {
                id: '3',
                title: 'Done task',
                identifier: 'ENG-100',
                dueDate: null,
                state: { name: 'Done', type: 'completed' },
                project: { id: 'proj-1', name: 'Heng Dashboard', color: '#5b9bc8' },
              },
              {
                id: '4',
                title: 'Mobile auth',
                identifier: 'MOB-1',
                dueDate: null,
                state: { name: 'Todo', type: 'unstarted' },
                project: { id: 'proj-2', name: 'Mobile App', color: '#9b85d4' },
              },
              {
                id: '5',
                title: 'No project task',
                identifier: 'GEN-1',
                dueDate: null,
                state: { name: 'Todo', type: 'unstarted' },
                project: null,
              },
            ],
          },
        },
      }),
    },
  })),
}));

const { default: linearModule } = await import('../integrations/linear.js');

describe('linear integration module', () => {
  it('has required shape', () => {
    expect(linearModule.name).toBe('linear');
    expect(typeof linearModule.interval).toBe('number');
    expect(typeof linearModule.fetch).toBe('function');
  });

  it('fetch returns projects array with lastUpdated', async () => {
    const data = await linearModule.fetch({ linear_api_key: 'test-key' });
    expect(Array.isArray(data.projects)).toBe(true);
    expect(data.lastUpdated).toBeDefined();
  });

  it('groups issues by project', async () => {
    const data = await linearModule.fetch({ linear_api_key: 'test-key' });
    const names = data.projects.map(p => p.name);
    expect(names).toContain('Heng Dashboard');
    expect(names).toContain('Mobile App');
    expect(names).toContain('General');
  });

  it('counts total and completed issues per project', async () => {
    const data = await linearModule.fetch({ linear_api_key: 'test-key' });
    const heng = data.projects.find(p => p.name === 'Heng Dashboard');
    expect(heng.totalIssues).toBe(3);
    expect(heng.completedIssues).toBe(1);
  });

  it('openIssues excludes completed issues', async () => {
    const data = await linearModule.fetch({ linear_api_key: 'test-key' });
    const heng = data.projects.find(p => p.name === 'Heng Dashboard');
    expect(heng.openIssues).toHaveLength(2);
    expect(heng.openIssues.every(i => i.stateType !== 'completed')).toBe(true);
  });

  it('issues with no project go to General', async () => {
    const data = await linearModule.fetch({ linear_api_key: 'test-key' });
    const general = data.projects.find(p => p.name === 'General');
    expect(general).toBeDefined();
    expect(general.openIssues[0].identifier).toBe('GEN-1');
  });

  it('sorts projects by open issue count descending', async () => {
    const data = await linearModule.fetch({ linear_api_key: 'test-key' });
    const counts = data.projects.map(p => p.openIssues.length);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
    }
  });
});
