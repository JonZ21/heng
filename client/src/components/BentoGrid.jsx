import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { dayProgress, weekProgress } from '../utils/time.js';
import ClockCard from './ClockCard.jsx';
import ProgressPie from './ProgressPie.jsx';
import LinearWidget from './LinearWidget.jsx';
import GoalsWidget from './GoalsWidget.jsx';

export default function BentoGrid({ linearData, setLinearData }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useWebSocket((msg) => {
    if (msg.type === 'integration' && msg.source === 'linear') {
      setLinearData(msg.data);
    }
  });

  return (
    <div className="bento">
      <LinearWidget data={linearData} />

      {/* Row 1, col 2 */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <ProgressPie
          progress={dayProgress(now)}
          color="var(--blue)"
          bgColor="var(--blue-light)"
          label={`${Math.round(dayProgress(now) * 100)}%`}
          sublabel="Today"
        />
      </div>

      {/* Row 1, col 3 */}
      <div style={{ gridColumn: 3, gridRow: 1 }}>
        <ProgressPie
          progress={weekProgress(now)}
          color="var(--lav)"
          bgColor="var(--lav-light)"
          label={`${Math.round(weekProgress(now) * 100)}%`}
          sublabel="This Week"
        />
      </div>

      {/* Row 1, col 4 */}
      <div style={{ gridColumn: 4, gridRow: 1 }}>
        <ClockCard />
      </div>

      <GoalsWidget />

      {/* Row 2, col 4: Streak placeholder */}
      <div className="card" style={{ gridColumn: 4, gridRow: 2 }}>
        <div className="card-label">Streak</div>
      </div>

      {/* Row 3, col 1-3: Ratings chart placeholder */}
      <div className="card" style={{ gridColumn: '1 / 4', gridRow: 3 }}>
        <div className="card-label">◈ Weekly Ratings</div>
      </div>

      {/* Row 3, col 4: Integrations placeholder */}
      <div className="card" style={{ gridColumn: 4, gridRow: 3 }}>
        <div className="card-label">⚡ Integrations</div>
      </div>
    </div>
  );
}
