import { useRef, useState } from 'react';

export interface Trace {
  id: string;
  label: string;
  unit: string;
  color: string;
  values: number[];
}

const VB_W = 900;
const VB_H = 220;
const PAD = { l: 56, r: 14, t: 12, b: 24 };

function fmtTime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return `d${d} ${String(h).padStart(2, '0')}:00`;
}
function fmtVal(v: number): string {
  const a = Math.abs(v);
  const dp = a >= 100 ? 0 : a >= 1 ? 2 : 4;
  return v.toLocaleString(undefined, { maximumFractionDigits: dp });
}

/**
 * An oscilloscope-style multi-trace time-series view: real Y axis with
 * gridlines, time X axis, a hover crosshair that reads out every trace's value
 * at that instant, and a legend you can prune. Traces share an auto-fit Y axis.
 */
export function Scope({
  traces,
  startStep,
  dt,
  onRemove,
}: {
  traces: Trace[];
  startStep: number;
  dt: number;
  onRemove: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverI, setHoverI] = useState<number | null>(null);

  const len = traces.reduce((m, t) => Math.max(m, t.values.length), 0);

  if (traces.length === 0 || len === 0) {
    return (
      <div className="scope empty">
        <div className="scope-hint">
          Click a signal below, or an edge / asset port, to plot it here — like probing a scope lead.
        </div>
      </div>
    );
  }

  let min = Infinity;
  let max = -Infinity;
  for (const t of traces) for (const v of t.values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 1;
  }
  if (max - min < 1e-9) max = min + 1;
  const m = (max - min) * 0.08;
  min -= m;
  max += m;

  const x = (i: number) => PAD.l + (len <= 1 ? 0 : (i / (len - 1)) * (VB_W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (VB_H - PAD.t - PAD.b);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));
  const xTickCount = 5;
  const xTicks = Array.from({ length: xTickCount }, (_, k) => Math.round((k / (xTickCount - 1)) * (len - 1)));

  const onMove = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * VB_W;
    const frac = (vx - PAD.l) / (VB_W - PAD.l - PAD.r);
    const i = Math.round(frac * (len - 1));
    setHoverI(i >= 0 && i < len ? i : null);
  };

  const hx = hoverI !== null ? x(hoverI) : 0;
  const tSec = hoverI !== null ? (startStep + hoverI) * dt : 0;

  return (
    <div className="scope">
      <div className="scope-legend">
        {traces.map((t) => {
          const v = hoverI !== null ? t.values[Math.min(hoverI, t.values.length - 1)] : t.values[t.values.length - 1];
          return (
            <span className="trace-chip" key={t.id}>
              <span className="trace-sw" style={{ background: t.color }} />
              <span className="trace-lbl">{t.label}</span>
              <span className="trace-val tnum" style={{ color: t.color }}>
                {fmtVal(v ?? 0)}
                {t.unit ? ` ${t.unit}` : ''}
              </span>
              <button className="trace-x" title="Remove" onClick={() => onRemove(t.id)}>
                ×
              </button>
            </span>
          );
        })}
      </div>
      <div className="scope-plot">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          onMouseMove={onMove}
          onMouseLeave={() => setHoverI(null)}
        >
          {/* y gridlines + labels */}
          {yTicks.map((v, k) => (
            <g key={k}>
              <line x1={PAD.l} x2={VB_W - PAD.r} y1={y(v)} y2={y(v)} className="grid" />
              <text x={PAD.l - 8} y={y(v) + 3} className="axis-lbl" textAnchor="end">
                {fmtVal(v)}
              </text>
            </g>
          ))}
          {/* x ticks */}
          {xTicks.map((i, k) => (
            <text key={k} x={x(i)} y={VB_H - 8} className="axis-lbl" textAnchor="middle">
              {fmtTime((startStep + i) * dt)}
            </text>
          ))}
          {/* traces */}
          {traces.map((t) => (
            <path
              key={t.id}
              d={t.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
              fill="none"
              stroke={t.color}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* crosshair */}
          {hoverI !== null && (
            <>
              <line x1={hx} x2={hx} y1={PAD.t} y2={VB_H - PAD.b} className="crosshair" />
              {traces.map((t) => {
                const v = t.values[Math.min(hoverI, t.values.length - 1)];
                return <circle key={t.id} cx={hx} cy={y(v ?? 0)} r={3} fill={t.color} />;
              })}
            </>
          )}
        </svg>
        {hoverI !== null && (
          <div className="scope-tip" style={{ left: `${(hx / VB_W) * 100}%` }}>
            <div className="tip-t">{fmtTime(tSec)}</div>
            {traces.map((t) => (
              <div className="tip-row" key={t.id}>
                <span className="tip-sw" style={{ background: t.color }} />
                {t.label}
                <b className="tnum">
                  {fmtVal(t.values[Math.min(hoverI, t.values.length - 1)] ?? 0)}
                  {t.unit ? ` ${t.unit}` : ''}
                </b>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
