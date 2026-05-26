import { useState, useEffect } from 'react';

const COMING_SOON = ['Slack', 'Messenger'];

export default function IntegrationsCard() {
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then(setIntegrations)
      .catch(() => {});
  }, []);

  return (
    <div className="card" style={{
      gridColumn: 4, gridRow: 3,
      display: 'flex', flexDirection: 'column', gap: '0.45rem',
    }}>
      <div className="card-label">⚡ Integrations</div>

      {integrations.map(({ name, status }) => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.45rem 0.6rem', borderRadius: '10px',
          background: 'var(--blue-light)',
          fontSize: '0.72rem', fontWeight: 500, color: 'var(--blue-dark)',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: status === 'active' ? 'var(--blue)' : '#f4a0a0',
          }} />
          {name.charAt(0).toUpperCase() + name.slice(1)}
        </div>
      ))}

      {COMING_SOON.map(name => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.45rem 0.6rem', borderRadius: '10px',
          background: '#f6f6f8',
          fontSize: '0.72rem', fontWeight: 500, color: '#bbb',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ddd', flexShrink: 0 }} />
          {name}
        </div>
      ))}

      <div style={{
        marginTop: 'auto', fontSize: '0.62rem',
        color: 'var(--lav)', textAlign: 'center', paddingTop: '0.4rem',
      }}>
        + add integration
      </div>
    </div>
  );
}
