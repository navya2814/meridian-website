import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useApp } from '../AppContext.jsx';

/**
 * Draws a Chart.js chart. `build` returns a Chart.js config and is called again whenever
 * `deps`, the theme, the company colours or the shared data change.
 */
export default function ChartCanvas({ build, deps = [], size = '', label }) {
  const ref = useRef(null);
  const { chartKey } = useApp();
  useEffect(() => {
    if (!ref.current) return undefined;
    const cfg = build();
    if (!cfg) return undefined;
    const chart = new Chart(ref.current, cfg);
    return () => chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartKey, ...deps]);
  return (
    <div className={`chart-box ${size}`}>
      <canvas ref={ref} role="img" aria-label={label} />
    </div>
  );
}
