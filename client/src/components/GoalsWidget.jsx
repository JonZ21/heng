import { useState } from 'react';
import { useGoals } from '../hooks/useGoals.js';

export default function GoalsWidget() {
  const { goals, addGoal, toggleGoal } = useGoals();
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const completed = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? completed / goals.length : 0;

  async function handleAdd(e) {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;
    await addGoal(title);
    setInputValue('');
    setShowInput(false);
  }

  return (
    <div className="card" style={{ gridColumn: '2 / 4', gridRow: 2, position: 'relative' }}>
      <div style={{
        position: 'absolute', width: '120px', height: '120px', borderRadius: '50%',
        background: 'var(--lav-light)', bottom: '-40px', right: 0,
        filter: 'blur(35px)', opacity: 0.7, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-label">◎ This Week's Goals</div>
        <button
          onClick={() => setShowInput(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 600, padding: '0 0.2rem',
          }}
        >
          {showInput ? '✕' : '+ add'}
        </button>
      </div>

      {showInput && (
        <form onSubmit={handleAdd} style={{ marginBottom: '0.6rem' }}>
          <input
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="New goal…"
            style={{
              width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px',
              border: '1.5px solid var(--blue-light)', fontSize: '0.77rem',
              fontFamily: 'var(--font)', outline: 'none', color: 'var(--text)',
            }}
          />
        </form>
      )}

      {goals.length === 0 && !showInput && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>No goals yet — tap + add</p>
      )}

      {goals.map(goal => (
        <div
          key={goal.id}
          onClick={() => toggleGoal(goal.id, !goal.completed)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.4rem 0', borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '17px', height: '17px', borderRadius: '50%', flexShrink: 0,
            background: goal.completed ? 'var(--blue)' : 'transparent',
            border: goal.completed ? 'none' : '2px solid #ddd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {goal.completed && <span style={{ color: 'white', fontSize: '0.55rem', fontWeight: 800 }}>✓</span>}
          </div>
          <span style={{
            fontSize: '0.77rem', color: 'var(--text)',
            textDecoration: goal.completed ? 'line-through' : 'none',
            opacity: goal.completed ? 0.4 : 1,
            flex: 1,
          }}>
            {goal.title}
          </span>
        </div>
      ))}

      {goals.length > 0 && (
        <div style={{ marginTop: '0.7rem', height: '4px', background: 'var(--blue-light)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, var(--blue), var(--blue-mid))',
            borderRadius: '99px', transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  );
}
