import { useState, useEffect, useCallback, useRef } from 'react';
import SleepScreen from './components/SleepScreen.jsx';
import BentoGrid from './components/BentoGrid.jsx';

const SLEEP_TIMEOUT_MS = 2 * 60 * 1000;

export default function App() {
  const [sleeping, setSleeping] = useState(false);
  const [linearData, setLinearData] = useState(null);
  const timerRef = useRef(null);

  const wake = useCallback(() => {
    setSleeping(false);
    resetTimer();
  }, []);

  function resetTimer() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSleeping(true), SLEEP_TIMEOUT_MS);
  }

  useEffect(() => {
    resetTimer();
    const events = ['click', 'touchstart', 'keydown', 'mousemove'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, []);

  return (
    <>
      <SleepScreen sleeping={sleeping} onWake={wake} />
      <BentoGrid linearData={linearData} setLinearData={setLinearData} />
    </>
  );
}
