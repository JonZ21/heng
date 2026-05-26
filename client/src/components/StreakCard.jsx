import { useRatings } from '../hooks/useRatings.js';
import { computeStreak } from '../utils/time.js';

export default function StreakCard() {
  const { ratings } = useRatings(12);
  const streak = computeStreak(ratings);

  return (
    <div className="card" style={{
      gridColumn: 4, gridRow: 2,
      background: 'linear-gradient(145deg, var(--lav-light), #ddd8f5)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{
        fontSize: '2.4rem', fontWeight: 800,
        color: 'var(--lav)', letterSpacing: '-0.04em',
      }}>
        {streak}
      </div>
      <div style={{
        fontSize: '0.62rem', color: 'var(--lav)', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginTop: '0.2rem', opacity: 0.75,
      }}>
        Week Streak
      </div>
    </div>
  );
}
