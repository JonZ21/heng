import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createDb } from './db.js';
import { createApp } from './app.js';
import { createWsHub } from './ws.js';
import { createLoader } from './integrations/loader.js';
import linearModule from './integrations/linear.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || './dashboard.db';

const db = createDb(DB_PATH);
const httpServer = http.createServer();
const { broadcast, close: closeWs } = createWsHub(httpServer);
const loader = createLoader(broadcast);

// Load integrations
const linearApiKey = db.prepare("SELECT value FROM integrations_config WHERE key = 'linear_api_key'").get();
if (linearApiKey || process.env.LINEAR_API_KEY) {
  loader.register(linearModule, {
    linear_api_key: process.env.LINEAR_API_KEY || linearApiKey.value,
  });
  // Initial fetch on startup
  loader.refresh('linear');
}

const app = createApp(db, loader);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

httpServer.on('request', app);
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  closeWs();
  db.close();
  process.exit(0);
});
