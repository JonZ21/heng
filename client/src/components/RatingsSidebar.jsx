import { useState } from 'react';
import { useRatings } from '../hooks/useRatings.js';
import { getWeekStart } from '../utils/time.js';

function formatWeekLabel(weekStart) {
  const [, month, day] = weekStart.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

export default function RatingsSidebar() {
  const { ratings, addRating, deleteRating } = useRatings(3);
  const [showForm, setShowForm] = useState(false);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const rating = parseFloat(value);
    if (!rating || rating < 1 || rating > 10) return;
    setSubmitting(true);
    await addRating(getWeekStart(), rating, notes);
    setValue('');
    setNotes('');
    setShowForm(false);
    setSubmitting(false);
  }

  return (
    <div className="card">
      <div className="card-label">◈ Ratings</div>

      {ratings.map(r => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <div style={{ fontSize: '0.58rem', color: '#ccc', width: '2.8rem', flexShrink: 0 }}>
            {formatWeekLabel(r.week_start)}
          </div>
          <div style={{ flex: 1, height: '10px', background: '#f0f0f5', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${r.rating * 10}%`,
              background: 'linear-gradient(90deg, #a8cfe8, #5b9bc8)',
              borderRadius: '99px',
            }} />
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--blue)', width: '1.5rem', textAlign: 'right', flexShrink: 0 }}>
            {r.rating}
          </div>
          <button
            onClick={() => deleteRating(r.id)}
            title="Delete"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#ddd', fontSize: '0.6rem', padding: '0 0.1rem',
              flexShrink: 0, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleSubmit} style={{ marginTop: '0.55rem' }}>
          <input
            type="number" min="1" max="10" step="0.5"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="1–10"
            required
            autoFocus
            style={{
              width: '100%', padding: '0.3rem 0.5rem', borderRadius: '6px',
              border: '1.5px solid var(--blue-light)', fontSize: '0.7rem',
              marginBottom: '0.3rem', outline: 'none', fontFamily: 'var(--font)',
            }}
          />
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            style={{
              width: '100%', padding: '0.3rem 0.5rem', borderRadius: '6px',
              border: '1.5px solid var(--blue-light)', fontSize: '0.7rem',
              marginBottom: '0.3rem', outline: 'none', fontFamily: 'var(--font)',
            }}
          />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1, background: 'var(--blue)', color: '#fff',
                border: 'none', borderRadius: '6px', padding: '0.3rem',
                fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setValue(''); setNotes(''); }}
              style={{
                flex: 1, background: '#f0f0f5', border: 'none',
                borderRadius: '6px', padding: '0.3rem',
                fontSize: '0.65rem', color: '#888', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%', marginTop: '0.55rem', background: '#f2f0f8',
            border: 'none', borderRadius: '8px', padding: '0.38rem',
            fontSize: '0.65rem', fontWeight: 600, color: '#9b85d4', cursor: 'pointer',
          }}
        >
          + Rate this week
        </button>
      )}
    </div>
  );
}
