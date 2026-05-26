function IssueItem({ issue, variant }) {
  const borderColor = variant === 'active' ? 'var(--blue)' : variant === 'overdue' ? 'var(--lav)' : 'transparent';
  const bg = variant === 'active' ? 'var(--blue-light)' : variant === 'overdue' ? 'var(--lav-light)' : 'rgba(0,0,0,0.02)';
  const dotColor = variant === 'active' ? 'var(--blue)' : variant === 'overdue' ? 'var(--lav)' : '#d0d0d8';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.55rem',
      padding: '0.5rem 0.6rem', borderRadius: '10px',
      background: bg,
      marginBottom: '0.3rem',
      opacity: variant === 'upcoming' ? 0.6 : 1,
    }}>
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: dotColor, marginTop: '5px', flexShrink: 0,
      }} />
      <div>
        <div style={{ fontSize: '0.77rem', fontWeight: 500, lineHeight: 1.35, color: 'var(--text)' }}>
          {issue.title}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-sub)', marginTop: '0.1rem' }}>
          {issue.identifier}
          {issue.dueDate && ` · due ${issue.dueDate}`}
        </div>
      </div>
    </div>
  );
}

function Section({ label, issues, variant }) {
  if (!issues?.length) return null;
  return (
    <>
      <div style={{
        fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'var(--text-sub)', opacity: 0.6,
        margin: '0.7rem 0 0.4rem 0.1rem',
      }}>
        {label}
      </div>
      {issues.map(issue => (
        <IssueItem key={issue.id} issue={issue} variant={variant} />
      ))}
    </>
  );
}

export default function LinearWidget({ data }) {
  const lastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  return (
    <div className="card" style={{
      gridColumn: 1, gridRow: '1 / 3',
      overflowY: 'auto',
      background: 'linear-gradient(145deg, #fff 60%, #eef6ff)',
    }}>
      <div style={{
        position: 'absolute', width: '180px', height: '180px', borderRadius: '50%',
        background: 'var(--blue-light)', top: '-60px', right: '-60px',
        filter: 'blur(40px)', opacity: 0.6, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="card-label">⬡ Linear</div>
        {lastUpdated && (
          <div style={{ fontSize: '0.55rem', color: 'var(--text-sub)', opacity: 0.5 }}>
            {lastUpdated}
          </div>
        )}
      </div>

      {!data && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Connecting…</p>
      )}

      {data && (
        <>
          <Section label="In Progress" issues={data.inProgress} variant="active" />
          <Section label="Overdue" issues={data.overdue} variant="overdue" />
          <Section label="Upcoming" issues={data.upcoming} variant="upcoming" />
        </>
      )}
    </div>
  );
}
