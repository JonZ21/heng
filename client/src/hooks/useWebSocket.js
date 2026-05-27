import { useEffect, useRef, useCallback } from 'react';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
const MAX_BACKOFF_MS = 30_000;

export function useWebSocket(onMessage) {
  const socketRef = useRef(null);
  const attemptsRef = useRef(0);
  const intentionalRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;
    intentionalRef.current = false;

    ws.onopen = () => {
      attemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        onMessageRef.current(msg);
      } catch {}
    };

    ws.onclose = () => {
      if (intentionalRef.current) return;
      const delay = Math.min(1000 * 2 ** attemptsRef.current, MAX_BACKOFF_MS);
      attemptsRef.current++;
      setTimeout(connect, delay);
    };

    // onerror always fires before onclose — no need to close manually
    ws.onerror = () => {};
  }, []);

  useEffect(() => {
    connect();
    return () => {
      intentionalRef.current = true;
      socketRef.current?.close();
    };
  }, [connect]);
}
