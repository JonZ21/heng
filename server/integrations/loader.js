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
