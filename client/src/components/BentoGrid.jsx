import { useWebSocket } from '../hooks/useWebSocket.js';

export default function BentoGrid({ linearData, setLinearData }) {
  useWebSocket((msg) => {
    if (msg.type === 'integration' && msg.source === 'linear') {
      setLinearData(msg.data);
    }
  });

  return (
    <div className="bento">
      {/* widgets added in subsequent tasks */}
    </div>
  );
}
