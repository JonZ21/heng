import { useState, useEffect } from 'react';
import { formatTime, formatDateLabel } from '../utils/time.js';

export default function ClockCard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card" style={{
      background: 'linear-gradient(145deg, #eef5fc, #ddeef9)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{
        fontSize: '2rem', fontWeight: 300,
        letterSpacing: '0.04em', color: 'var(--blue-dark)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatTime(now)}
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--blue)', marginTop: '0.3rem' }}>
        {formatDateLabel(now)}
      </div>
    </div>
  );
}
