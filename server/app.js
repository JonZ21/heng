import express from 'express';
import cors from 'cors';
import goalsRouter from './routes/goals.js';
import ratingsRouter from './routes/ratings.js';
import integrationsRouter from './routes/integrations.js';
import linearRouter from './routes/linear.js';

export function createApp(db, loader = null) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/goals', goalsRouter(db));
  app.use('/api/ratings', ratingsRouter(db));
  app.use('/api/integrations', integrationsRouter(loader));
  app.use('/api/linear', linearRouter(db));

  return app;
}
