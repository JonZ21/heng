export default function ProgressPie({ progress, color, bgColor, label, sublabel }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <div className="card">
      <div className="card-label">{sublabel}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <svg width="58" height="58" viewBox="0 0 60 60" style={{ flexShrink: 0, overflow: 'visible' }}>
          <circle cx="30" cy="30" r={radius} fill="none" stroke={bgColor} strokeWidth="8" />
          <circle
            cx="30" cy="30" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
          />
          <circle cx="30" cy="30" r="9" fill="white" />
        </svg>
        <div>
          <div style={{ fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
