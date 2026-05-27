import { useState } from 'react';
import { useGoals } from '../hooks/useGoals.js';

const CIRCUMFERENCE = 2 * Math.PI * 18;

function Donut({ completed, total }) {
  const frac = total > 0 ? completed / total : 0;
  const dashArray = `${frac * CIRCUMFERENCE} ${CIRCUMFERENCE}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem' }}>
      <svg width="54" height="54" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="18" fill="none" stroke="#d4eaf7" strokeWidth="7" />
        <circle
          cx="24" cy="24" r="18" fill="none"
          stroke="#5b9bc8" strokeWidth="7"
          strokeDasharray={dashArray}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
        <text
          x="24" y="28" textAnchor="middle"
          fontSize="9" fontWeight="700" fill="#2d6a92"
          fontFamily="-apple-system,sans-serif"
        >
          {completed}/{total}
        </text>
      </svg>
    </div>
  );
}

export default function GoalsWidget() {
  const { goals, addGoal, toggleGoal } = useGoals();
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const completed = goals.filter(g => g.completed).length;

  async function handleAdd(e) {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;
    await addGoal(title);
    setInputValue('');
    setShowInput(false);
  }

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <div className="card-label">◎ Goals</div>

      <Donut completed={completed} total={goals.length} />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {goals.map(goal => (
          <div
            key={goal.id}
            onClick={() => toggleGoal(goal.id, !goal.completed)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.28rem 0', borderBottom: '1px solid #f5f5f7',
              cursor: 'pointer', overflow: 'hidden',
            }}
          >
            <div style={{
              width: '13px', height: '13px', borderRadius: '50%', flexShrink: 0,
              background: goal.completed ? '#5b9bc8' : 'transparent',
              border: goal.completed ? 'none' : '1.5px solid #ddd',
            }} />
            <span style={{
              fontSize: '0.65rem', color: 'var(--text)',
              textDecoration: goal.completed ? 'line-through' : 'none',
              opacity: goal.completed ? 0.4 : 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {goal.title}
            </span>
          </div>
        ))}
      </div>

      {showInput ? (
        <form onSubmit={handleAdd} style={{ marginTop: '0.35rem' }}>
          <input
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="New goal…"
            style={{
              width: '100%', padding: '0.3rem 0.5rem', borderRadius: '6px',
              border: '1.5px solid var(--blue-light)', fontSize: '0.65rem',
              fontFamily: 'var(--font)', outline: 'none', color: 'var(--text)',
            }}
          />
        </form>
      ) : (
        <div
          onClick={() => setShowInput(true)}
          style={{ fontSize: '0.62rem', color: '#5b9bc8', fontWeight: 600, marginTop: '0.35rem', cursor: 'pointer' }}
        >
          + add goal
        </div>
      )}
    </div>
  );
}
