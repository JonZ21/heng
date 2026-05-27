import { useWebSocket } from '../hooks/useWebSocket.js';
import ClockCard from './ClockCard.jsx';
import LinearWidget from './LinearWidget.jsx';
import GoalsWidget from './GoalsWidget.jsx';
import RatingsSidebar from './RatingsSidebar.jsx';

export default function BentoGrid({ linearData, setLinearData }) {
  useWebSocket((msg) => {
    if (msg.type === 'integration' && msg.source === 'linear') {
      setLinearData(msg.data);
    }
  });

  return (
    <div className="bento">
      <LinearWidget data={linearData} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', minHeight: 0 }}>
        <ClockCard />
        <GoalsWidget />
        <RatingsSidebar />
      </div>
    </div>
  );
}
