import { useState, useEffect } from 'react';
import { formatTime, formatDateLabel, dayProgress } from '../utils/time.js';

export default function SleepScreen({ sleeping, onWake }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = dayProgress(time);

  return (
    <div
      className={`sleep-overlay${sleeping ? '' : ' hidden'}`}
      onClick={onWake}
    >
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{
          fontSize: '4rem',
          fontWeight: 200,
          letterSpacing: '0.06em',
          color: 'rgba(255,255,255,0.85)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatTime(time)}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.3)',
          marginTop: '0.5rem',
          letterSpacing: '0.08em',
        }}>
          {formatDateLabel(time)}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '2px',
        background: 'rgba(255,255,255,0.04)',
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, rgba(91,155,200,0.35), rgba(155,133,212,0.35))',
          transition: 'width 60s linear',
        }} />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '1.25rem',
        fontSize: '0.58rem',
        color: 'rgba(255,255,255,0.13)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Tap anywhere to wake
      </div>

      <div style={{
        position: 'absolute',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,155,200,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
