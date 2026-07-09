/** A minimal, dependency-free SVG line chart with a stable footprint. */
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
  const W = 236;
  const H = 74;
  const pad = 4;
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
  if (max - min < 1e-9) max = min + 1;
  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad);
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = n ? `${line} L${x(n - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z` : '';
  const latest = n ? values[n - 1] : 0;
  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="chart">
      <div className="chart-h">
        <span className="chart-t">{title}</span>
        <span className="chart-v tnum" style={{ color }}>
          {fmt(latest)} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={area} fill={color} opacity={0.08} />
        <path d={line} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="chart-x tnum">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}
