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
