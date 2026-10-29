// Shared Chart.js options that follow the current theme colours.
import { cssv, inr, CR, crTick } from './format.js';

export function baseOpts({ y = crTick, legend = false, stacked = false, x = {}, yExtra = {}, tip } = {}) {
  const muted = cssv('--muted'), grid = cssv('--line-2');
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 450 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: legend, position: 'bottom', labels: { color: muted, boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { family: 'Geist', size: 11.5 } } },
      tooltip: {
        backgroundColor: '#2B1B14', titleColor: '#FBF4EA', bodyColor: '#EDE3D6', borderColor: 'rgba(255,255,255,.08)', borderWidth: 1,
        padding: 10, cornerRadius: 8, titleFont: { family: 'Geist', weight: '600' }, bodyFont: { family: 'Geist Mono', size: 11.5 },
        callbacks: { label: tip || (c => ` ${c.dataset.label}: ${inr((Array.isArray(c.raw) ? c.raw[1] - c.raw[0] : c.raw) * CR)}`) },
      },
    },
    scales: {
      x: { stacked, grid: { display: false }, border: { color: grid }, ticks: { color: muted, font: { family: 'Geist', size: 11 }, maxRotation: 0, autoSkipPadding: 12 }, ...x },
      y: { stacked, grid: { color: grid }, border: { display: false }, ticks: { color: muted, font: { family: 'Geist Mono', size: 10.5 }, callback: y, maxTicksLimit: 6 }, ...yExtra },
    },
  };
}

/** Horizontal bar options with readable category labels. */
export function hBarOpts(opts = {}) {
  const o = baseOpts(opts);
  o.indexAxis = 'y';
  o.scales.x.grid = { color: cssv('--line-2') };
  o.scales.x.ticks.callback = opts.xTick || crTick;
  o.scales.y.grid = { display: false };
  o.scales.y.ticks.callback = function (v) { return this.getLabelForValue(v); };
  o.scales.y.ticks.font = { family: 'Geist', size: 12 };
  return o;
}
