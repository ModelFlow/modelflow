/** User-defined alert conditions, saved views, and saved parameter sets. */

export type AlertOp = '>' | '>=' | '<' | '<=';

export interface Alert {
  id: string;
  seriesId: string;
  op: AlertOp;
  threshold: number;
}

/** A saved "view": what's on the scope, the alerts, and layout/fidelity. */
export interface ViewTemplate {
  name: string;
  traceIds: string[];
  alerts: Alert[];
  showModels: boolean;
  fidelity: Record<string, number>;
}

/** A saved parameter set: per-instance parameter overrides. */
export interface ParamSet {
  name: string;
  overrides: Record<string, Record<string, number>>;
}

export function evalAlert(op: AlertOp, v: number, threshold: number): boolean {
  switch (op) {
    case '>':
      return v > threshold;
    case '>=':
      return v >= threshold;
    case '<':
      return v < threshold;
    case '<=':
      return v <= threshold;
  }
}

export function uid(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  return c?.randomUUID ? c.randomUUID() : `id-${Date.now()}-${Math.floor(performance.now() * 1000) % 1e6}`;
}

const KEY_TPL = 'modelflow.templates.v1';
const KEY_PS = 'modelflow.paramsets.v1';

function read<T>(key: string): T[] {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T[]) : [];
  } catch {
    return [];
  }
}
function write<T>(key: string, v: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

export const loadTemplates = () => read<ViewTemplate>(KEY_TPL);
export const storeTemplates = (t: ViewTemplate[]) => write(KEY_TPL, t);
export const loadParamSets = () => read<ParamSet>(KEY_PS);
export const storeParamSets = (p: ParamSet[]) => write(KEY_PS, p);
