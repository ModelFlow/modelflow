/** A tiny dependency-free SVG line chart over a rolling window of values. */
export function Chart({
  title,
  unit,
  values,
  color,
}: {
  title: string;
  unit: string;
  values: number[];
  color: string;
}) {
  const W = 260;
  const H = 90;
  const pad = 6;
  const n = values.length;
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 1;
  }
  if (max - min < 1e-9) {
    max = min + 1;
  }
  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const latest = n ? values[n - 1] : 0;

  return (
    <div className="chart">
      <div className="chart-head">
        <span className="chart-title">{title}</span>
        <span className="chart-val" style={{ color }}>
          {latest.toLocaleString(undefined, { maximumFractionDigits: 2 })} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <path d={d} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
      <div className="chart-range">
        <span>{min.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
        <span>{max.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
      </div>
    </div>
  );
}
