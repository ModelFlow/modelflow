import type { Unit } from './types';

/** One provenance entry for a parameter — a citation and/or a link, with an optional note. */
export interface ParamSource {
  /** Human citation, e.g. "NASA/TP-2015-218570 Rev 2, Table 4-1". */
  citation?: string;
  /** Link to the source (paper, dataset, datasheet, spec). */
  url?: string;
  /** What this source says / why it was chosen. */
  note?: string;
}

/**
 * A tunable constant with provenance. Params never change during a run (states
 * do that); they are the knobs a trade study sweeps. Every field of provenance
 * is optional — but when present, a UI (and the Model Library) can show detailed
 * notes and clickable source links for where each number came from.
 */
export interface ParamSpec {
  readonly value: number;
  readonly unit: Unit;
  /** Short one-line description. */
  readonly desc: string;
  /** Longer explanatory notes — assumptions, derivation, caveats. */
  readonly notes?: string;
  /** Short citation, e.g. "NASA/TP-2015-218570 Table 4-1". */
  readonly source?: string;
  /** A single link for `source` (convenience for the common case). */
  readonly sourceUrl?: string;
  /** One or more detailed provenance entries (citation + link + note). */
  readonly sources?: ParamSource[];
  readonly confidence?: 'low' | 'med' | 'high';
  readonly min?: number;
  readonly max?: number;
}

/**
 * Terse constructor:
 *   param(5, 'kW', 'Rated output')
 *   param(0.22, 'frac', 'Cell efficiency', {
 *     source: 'Spectrolab XTJ Prime', sourceUrl: 'https://…', notes: 'STC, BOL',
 *   })
 */
export function param(
  value: number,
  unit: Unit,
  desc: string,
  opts: Omit<Partial<ParamSpec>, 'value' | 'unit' | 'desc'> = {},
): ParamSpec {
  return { value, unit, desc, ...opts };
}
