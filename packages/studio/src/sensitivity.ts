import { Engine, type Scenario, type ModelRegistry } from '@modelflow/core';

export type Metric = 'sum' | 'mean' | 'final';

export interface SensiRow {
  key: string;
  param: string;
  label: string;
  base: number;
  lowMetric: number;
  highMetric: number;
  impact: number; // max absolute deviation from baseline metric
  impactPct: number; // relative to baseline metric magnitude
}

export interface SensiResult {
  baseMetric: number;
  rows: SensiRow[];
  skipped: number; // params with zero baseline (can't perturb by %)
}

interface PInfo {
  key: string;
  param: string;
  base: number;
  min?: number;
  max?: number;
}

/** Every effective parameter across all instances (instance override or def default). */
function collectParams(scn: Scenario, reg: ModelRegistry): PInfo[] {
  const out: PInfo[] = [];
  for (const inst of scn.instances) {
    const def = reg.get(inst.type);
    if (!def?.params) continue;
    for (const [name, ps] of Object.entries(def.params)) {
      const base = inst.params?.[name] ?? ps.value;
      out.push({ key: inst.key, param: name, base, min: ps.min, max: ps.max });
    }
  }
  return out;
}

/** Clamp a perturbed value to the param's declared bounds so the build never rejects it. */
function clamp(v: number, min?: number, max?: number): number {
  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return v;
}

function safeMetric(scn: Scenario, reg: ModelRegistry, seriesId: string, mode: Metric, fallback: number): number {
  try {
    return runMetric(scn, reg, seriesId, mode);
  } catch {
    return fallback; // an out-of-bounds/invalid perturbation → treat as no change
  }
}

function withOverride(scn: Scenario, key: string, param: string, value: number): Scenario {
  return {
    ...scn,
    instances: scn.instances.map((i) => (i.key === key ? { ...i, params: { ...(i.params ?? {}), [param]: value } } : i)),
  };
}

function runMetric(scn: Scenario, reg: ModelRegistry, seriesId: string, mode: Metric): number {
  const eng = new Engine(scn.timestepSeconds, scn.epochMs ?? 0, scn.seed);
  eng.build(scn, reg);
  eng.run();
  const s = eng.history.series(seriesId);
  if (!s) return 0;
  const arr = s.toArray();
  if (arr.length === 0) return 0;
  if (mode === 'final') return arr[arr.length - 1];
  const total = arr.reduce((a, b) => a + b, 0);
  return mode === 'mean' ? total / arr.length : total;
}

/**
 * One-at-a-time (OAT) sensitivity: perturb every parameter ±deltaPct, measure
 * the change in a chosen output series, and rank by impact — a tornado.
 */
export function sensitivity(
  scn: Scenario,
  reg: ModelRegistry,
  opts: { seriesId: string; mode?: Metric; deltaPct?: number },
): SensiResult {
  const mode = opts.mode ?? 'sum';
  const delta = opts.deltaPct ?? 0.2;
  const baseMetric = runMetric(scn, reg, opts.seriesId, mode);
  const denom = Math.abs(baseMetric) > 1e-9 ? Math.abs(baseMetric) : 1;

  const rows: SensiRow[] = [];
  let skipped = 0;
  for (const p of collectParams(scn, reg)) {
    if (!Number.isFinite(p.base) || p.base === 0) {
      skipped++;
      continue;
    }
    const lowV = clamp(p.base * (1 - delta), p.min, p.max);
    const highV = clamp(p.base * (1 + delta), p.min, p.max);
    const lowMetric = safeMetric(withOverride(scn, p.key, p.param, lowV), reg, opts.seriesId, mode, baseMetric);
    const highMetric = safeMetric(withOverride(scn, p.key, p.param, highV), reg, opts.seriesId, mode, baseMetric);
    const impact = Math.max(Math.abs(highMetric - baseMetric), Math.abs(lowMetric - baseMetric));
    rows.push({
      key: p.key,
      param: p.param,
      label: `${p.key}.${p.param}`,
      base: p.base,
      lowMetric,
      highMetric,
      impact,
      impactPct: (impact / denom) * 100,
    });
  }
  rows.sort((a, b) => b.impact - a.impact);
  return { baseMetric, rows, skipped };
}
