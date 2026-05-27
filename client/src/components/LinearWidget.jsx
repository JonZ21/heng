import { useState, useEffect, useRef } from 'react';

function statusDotColor(issue) {
  const today = new Date().toISOString().split('T')[0];
  if (issue.stateType === 'started') return '#5b9bc8';
  if (issue.dueDate && issue.dueDate < today) return '#9b85d4';
  return '#d0d0d8';
}

function IssueRow({ issue, onComplete }) {
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  async function handleComplete() {
    setDone(true);
    try {
      const res = await fetch(`/api/linear/complete/${issue.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      onComplete(issue.id);
    } catch {
      setDone(false);
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  }

  if (done) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.4rem 0.45rem', borderRadius: '7px',
      background: '#fff', minWidth: 0,
    }}>
      <button
        onClick={handleComplete}
        title="Mark done"
        style={{
          width: '16px', height: '16px', borderRadius: '50%',
          border: `1.5px solid ${error ? '#e05050' : '#d0d0d8'}`,
          background: 'transparent', cursor: 'pointer', flexShrink: 0,
          padding: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.7rem', fontWeight: 500, color: 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3,
        }}>
          {issue.title}
        </div>
        <div style={{ fontSize: '0.57rem', color: '#bbb' }}>
          {issue.identifier}{issue.dueDate ? ` · ${issue.dueDate}` : ''}
        </div>
      </div>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: statusDotColor(issue), flexShrink: 0,
      }} />
    </div>
  );
}

function ProjectColumn({ project, onComplete }) {
  const pct = project.totalIssues > 0
    ? Math.round((project.completedIssues / project.totalIssues) * 100)
    : 0;

  return (
    <div style={{
      background: '#fafafa', borderRadius: '12px',
      padding: '0.75rem 0.8rem', display: 'flex',
      flexDirection: 'column', overflow: 'hidden', flex: 1, minWidth: 0,
    }}>
      <div style={{ flexShrink: 0, marginBottom: '0.5rem' }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 600, color: 'var(--text)',
          display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: project.color, flexShrink: 0,
          }} />
          {project.name}
        </div>
        <div style={{ fontSize: '0.58rem', color: '#aaa', marginBottom: '0.4rem' }}>
          {project.completedIssues} / {project.totalIssues} done · {pct}%
        </div>
        <div style={{ height: '12px', background: '#eeeef5', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.75rem' }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: '99px',
            background: `linear-gradient(90deg, ${project.color}, ${project.color}99)`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {project.openIssues.map(issue => (
          <IssueRow key={issue.id} issue={issue} onComplete={onComplete} />
        ))}
      </div>
    </div>
  );
}

export default function LinearWidget({ data }) {
  const [removed, setRemoved] = useState(new Set());
  const prevDataRef = useRef(null);

  useEffect(() => {
    if (data && data !== prevDataRef.current) {
      prevDataRef.current = data;
      setRemoved(new Set());
    }
  }, [data]);

  function removeIssue(issueId) {
    setRemoved(prev => new Set([...prev, issueId]));
  }

  const lastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  const displayProjects = data
    ? data.projects.map(p => ({
        ...p,
        openIssues: p.openIssues.filter(i => !removed.has(i.id)),
      }))
    : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '0.8rem', flexShrink: 0,
      }}>
        <div className="card-label" style={{ marginBottom: 0 }}>⬡ Linear</div>
        {lastUpdated && (
          <div style={{ fontSize: '0.55rem', color: '#bbb' }}>updated {lastUpdated}</div>
        )}
      </div>

      {!data && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Connecting…</p>
      )}

      {displayProjects && (
        <div style={{ display: 'flex', gap: '10px', flex: 1, overflow: 'hidden' }}>
          {displayProjects.map(project => (
            <ProjectColumn key={project.id} project={project} onComplete={removeIssue} />
          ))}
        </div>
      )}
    </div>
  );
}
