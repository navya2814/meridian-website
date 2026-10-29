// Number, date and colour helpers. Money uses the Indian system (lakh and crore).

export const CR = 1e7;
export const LK = 1e5;

/** The sample figures in this build are a snapshot as of this date. */
export const DATA_AS_OF = '2026-10-07';

export function inr(n, opts = {}) {
  if (n == null || isNaN(n)) return '–';
  const neg = n < 0;
  const a = Math.abs(n);
  let s;
  if (a >= CR) s = (a / CR).toFixed(a >= 100 * CR ? 1 : 2) + ' Cr';
  else if (a >= LK) s = (a / LK).toFixed(a >= 10 * LK ? 1 : 2) + ' L';
  else s = Math.round(a).toLocaleString('en-IN');
  s = '₹' + s;
  if (opts.sign) return (neg ? '−' : '+') + s;
  return (neg ? '−' : '') + s;
}

export const inrFull = n => (n < 0 ? '−' : '') + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');

export function pct(x, d = 1, sign = false) {
  if (x == null || isNaN(x) || !isFinite(x)) return '–';
  if (sign) return (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(d) + '%';
  return (x * 100).toFixed(d) + '%';
}

export function fmtDate(d) {
  const x = new Date(d + 'T00:00:00');
  return x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Age of an imported file, measured against the sample data date. */
export function daysOld(d) {
  return Math.round((new Date(DATA_AS_OF + 'T00:00:00') - new Date(d + 'T00:00:00')) / 864e5);
}

export const today = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const shortToday = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export const coC = id => cssv('--c-' + id);

export function alpha(hex, a) {
  if (!hex || !hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function mixHex(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export const crTick = v => '₹' + (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1)) + ' Cr';

export const clone = o => JSON.parse(JSON.stringify(o));
