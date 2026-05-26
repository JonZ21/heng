import { useRef, useEffect } from 'react';
import { getWeekStart } from '../utils/time.js';

function formatWeekLabel(weekStart) {
  const d = new Date(weekStart + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RatingsChart({ ratings }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const sorted = [...ratings].reverse();
  const currentWeek = getWeekStart();
  const hasCurrentWeek = sorted.some(r => r.week_start === currentWeek);

  const chartData = hasCurrentWeek
    ? sorted
    : [...sorted, { week_start: currentWeek, rating: null }];

  const MIN = 1, MAX = 10;

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container || chartData.length < 2) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const toX = (i) => (i / (chartData.length - 1)) * W;
    const toY = (r) => H - ((r - MIN) / (MAX - MIN)) * H;

    const solidPoints = chartData
      .map((d, i) => d.rating !== null ? { x: toX(i), y: toY(d.rating), i } : null)
      .filter(Boolean);

    for (const v of [2, 4, 6, 8, 10]) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0); line.setAttribute('x2', W);
      line.setAttribute('y1', toY(v)); line.setAttribute('y2', toY(v));
      line.setAttribute('stroke', 'rgba(0,0,0,0.045)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }

    for (let k = 0; k < solidPoints.length - 1; k++) {
      const a = solidPoints[k], b = solidPoints[k + 1];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.setAttribute('stroke', 'var(--blue-mid)');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    }

    if (!hasCurrentWeek && solidPoints.length > 0) {
      const last = solidPoints[solidPoints.length - 1];
      const ghostX = toX(chartData.length - 1);
      const ghostY = toY(5);
      const dashed = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      dashed.setAttribute('x1', last.x); dashed.setAttribute('y1', last.y);
      dashed.setAttribute('x2', ghostX); dashed.setAttribute('y2', ghostY);
      dashed.setAttribute('stroke', 'var(--lav-mid)');
      dashed.setAttribute('stroke-width', '1.5');
      dashed.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(dashed);

      const ghostCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ghostCircle.setAttribute('cx', ghostX); ghostCircle.setAttribute('cy', ghostY);
      ghostCircle.setAttribute('r', '5');
      ghostCircle.setAttribute('fill', 'var(--lav-light)');
      ghostCircle.setAttribute('stroke', 'var(--lav-mid)');
      ghostCircle.setAttribute('stroke-width', '2');
      ghostCircle.setAttribute('stroke-dasharray', '3 2');
      svg.appendChild(ghostCircle);
    }

    for (const p of solidPoints) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', p.x); glow.setAttribute('cy', p.y);
      glow.setAttribute('r', '8');
      glow.setAttribute('fill', 'var(--blue-light)');
      glow.setAttribute('opacity', '0.5');
      svg.appendChild(glow);

      const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      node.setAttribute('cx', p.x); node.setAttribute('cy', p.y);
      node.setAttribute('r', '4.5');
      node.setAttribute('fill', 'white');
      node.setAttribute('stroke', 'var(--blue)');
      node.setAttribute('stroke-width', '2');
      svg.appendChild(node);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', p.x); label.setAttribute('y', p.y - 11);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '9');
      label.setAttribute('font-weight', '600');
      label.setAttribute('fill', 'var(--blue)');
      label.setAttribute('font-family', 'var(--font)');
      label.textContent = chartData[p.i].rating;
      svg.appendChild(label);
    }
  }, [ratings, hasCurrentWeek]);

  if (ratings.length === 0) {
    return (
      <div className="card" style={{ gridColumn: '1 / 4', gridRow: 3 }}>
        <div className="card-label">◈ Weekly Ratings</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>No ratings yet. Log your first week!</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ gridColumn: '1 / 4', gridRow: 3 }}>
      <div className="card-label">◈ Weekly Ratings</div>

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '1.4rem', width: '1.4rem' }}>
          {[10, 8, 6, 4, 2].map(v => (
            <span key={v} style={{ fontSize: '0.55rem', color: '#ccc', textAlign: 'right' }}>{v}</span>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div ref={containerRef} style={{ flex: 1, position: 'relative', height: '80px' }}>
            <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} />
          </div>

          <div style={{ display: 'flex' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', fontSize: '0.55rem',
                color: d.rating === null ? 'var(--lav)' : '#bbb',
                fontWeight: d.rating === null ? 600 : 400,
              }}>
                {d.rating === null ? 'This week' : formatWeekLabel(d.week_start)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
