import type { SensiResult } from './sensitivity';

const fmt = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toLocaleString(undefined, { maximumFractionDigits: a >= 1 ? 1 : 3 });
};

/** A tornado chart: parameters ranked by how much ±perturbing each moves the output. */
export function Tornado({ result }: { result: SensiResult }) {
  const rows = result.rows.slice(0, 14);
  if (rows.length === 0) return <div className="tor-empty">No non-zero parameters to vary.</div>;

  const vals = rows.flatMap((r) => [r.lowMetric, r.highMetric]).concat(result.baseMetric);
  let dmin = Math.min(...vals);
  let dmax = Math.max(...vals);
  if (dmax - dmin < 1e-9) dmax = dmin + 1;
  const m = (dmax - dmin) * 0.04;
  dmin -= m;
  dmax += m;
  const pct = (v: number) => ((v - dmin) / (dmax - dmin)) * 100;
  const basePct = pct(result.baseMetric);

  return (
    <div className="tornado">
      {rows.map((r) => {
        const lp = pct(r.lowMetric);
        const hp = pct(r.highMetric);
        return (
          <div className="tor-row" key={r.label}>
            <div className="tor-label mono" title={`${r.label} = ${fmt(r.base)}`}>
              {r.label}
            </div>
            <div className="tor-track">
              <div className="tor-base" style={{ left: `${basePct}%` }} />
              <div className="tor-bar minus" style={{ left: `${Math.min(basePct, lp)}%`, width: `${Math.abs(basePct - lp)}%` }} title={`−: ${fmt(r.lowMetric)}`} />
              <div className="tor-bar plus" style={{ left: `${Math.min(basePct, hp)}%`, width: `${Math.abs(basePct - hp)}%` }} title={`+: ${fmt(r.highMetric)}`} />
            </div>
            <div className="tor-impact tnum">
              {fmt(r.impact)} <span className="tor-pct">{r.impactPct.toFixed(0)}%</span>
            </div>
          </div>
        );
      })}
      <div className="tor-axis mono">
        <span>{fmt(dmin)}</span>
        <span className="tor-baselbl">baseline {fmt(result.baseMetric)}</span>
        <span>{fmt(dmax)}</span>
      </div>
      <div className="tor-key">
        <span>
          <i className="sw minus" /> parameter −
        </span>
        <span>
          <i className="sw plus" /> parameter +
        </span>
        {result.skipped > 0 && <span className="tor-skip">{result.skipped} zero-valued params skipped</span>}
      </div>
    </div>
  );
}
