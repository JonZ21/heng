import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { dayProgress, weekProgress } from '../utils/time.js';
import { useRatings } from '../hooks/useRatings.js';
import ClockCard from './ClockCard.jsx';
import ProgressPie from './ProgressPie.jsx';
import LinearWidget from './LinearWidget.jsx';
import GoalsWidget from './GoalsWidget.jsx';
import RatingsChart from './RatingsChart.jsx';
import StreakCard from './StreakCard.jsx';
import IntegrationsCard from './IntegrationsCard.jsx';

export default function BentoGrid({ linearData, setLinearData }) {
  const [now, setNow] = useState(new Date());
  const { ratings } = useRatings(6);

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

      <StreakCard />
      <RatingsChart ratings={ratings} />

      <IntegrationsCard />
    </div>
  );
}
