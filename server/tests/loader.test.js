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
