import { WebSocketServer } from 'ws';

export function createWsHub(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set();

  wss.on('connection', (socket) => {
    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
    socket.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'pong') return;
      } catch {}
    });
  });

  // Heartbeat to detect stale connections
  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'ping' }));
      }
    }
  }, 30_000);

  function broadcast(payload) {
    const msg = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === 1) client.send(msg);
    }
  }

  function close() {
    clearInterval(heartbeat);
    wss.close();
  }

  return { broadcast, close };
}
