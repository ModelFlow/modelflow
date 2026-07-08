import type { Unit } from './types';

/**
 * A tunable constant with provenance. Params never change during a run (states
 * do that); they are the knobs a trade study sweeps. Carrying `source` +
 * `confidence` lets a UI show where every number came from.
 */
export interface ParamSpec {
  readonly value: number;
  readonly unit: Unit;
  readonly desc: string;
  /** Provenance, e.g. "NASA/TP-2015-218570 Table 4-1". */
  readonly source?: string;
  readonly confidence?: 'low' | 'med' | 'high';
  readonly min?: number;
  readonly max?: number;
}

/** Terse constructor: `param(5, 'kW', 'Rated output', { source: '…' })`. */
export function param(
  value: number,
  unit: Unit,
  desc: string,
  opts: Omit<Partial<ParamSpec>, 'value' | 'unit' | 'desc'> = {},
): ParamSpec {
  return { value, unit, desc, ...opts };
}
