/**
 * The Recording contract — the seam between the engine and any viewer.
 *
 * The engine runs, then emits a Recording: parallel-array time series + sampled
 * frames + events + per-model key figures. The existing Mars web viewer plays
 * this format unchanged. Domain-specific `env`/`scene`/`ships` payloads come
 * from pluggable providers (Phase 1) so the core stays domain-free.
 *
 * INVARIANTS (relied on by the viewer):
 *  - series[i]        ∥ seriesMeta[i]              and every series[i].length === frames.length
 *  - frame.modules[i] ∥ moduleMeta[i], and values[j] ∥ moduleMeta[i].figures[j]
 */
export interface Recording {
  version: 1;
  scenarioName: string;
  scenarioFile: string | null;
  /** Frame-axis length in the viewer's units (Mars: sols). */
  durationSols: number;
  /** Frame spacing on that axis. */
  sampleSols: number;
  latitudeDeg: number;
  seriesMeta: { id: string; name: string; unit: string }[];
  series: number[][];
  moduleMeta: { id: string; name: string; maxFidelity: number; figures: [string, string][] }[];
  frames: RecFrame[];
  ships: RecShip[];
  events: { sol: number; severity: string; source: string; message: string }[];
}

export interface RecFrame {
  sol: number;
  env: RecEnv;
  scene: RecScene;
  modules: RecModuleState[];
}
export interface RecModuleState {
  status: string;
  health: 'nominal' | 'degraded' | 'failed' | 'offline';
  values: number[];
}
export interface RecEnv {
  sunEl: number;
  sunAz: number;
  tau: number;
  storm: boolean;
  airT: number;
  ghi: number;
}
export interface RecShip {
  name: string;
  role: string;
  contributesHabitatVolume: boolean;
  landedSol: number;
  departedSol: number | null;
}
/** Open bag of derived scene structure counts; domain SceneProjector fills it. */
export type RecScene = Record<string, number | boolean>;

/**
 * Quantiser copied verbatim from the Mars viewer's recorder — rounds to ~4
 * SIGNIFICANT figures (NOT 4 decimals), which is what keeps the emitted JSON
 * small yet lossless for the viewer. GHI 589.7 stays 589.7; SoC 0.00034217
 * becomes 0.0003422.
 */
export function round4(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x === 0) return 0;
  const m = Math.pow(10, 3 - Math.floor(Math.log10(Math.abs(x))));
  return Math.round(x * m) / m;
}
