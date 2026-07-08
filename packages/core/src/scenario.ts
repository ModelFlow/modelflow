import type { Fidelity } from './types';
import type { CommoditySpec } from './commodity';

/** One model instance placed in the scenario tree. Pure data. */
export interface InstanceSpec {
  /** Unique instance key. */
  readonly key: string;
  /** ModelDef.type to instantiate (must be in the registry). */
  readonly type: string;
  /** Tree parent key; null/omitted = top level. Nearest-owner walks up this. */
  readonly parent?: string | null;
  /** Per-instance param overrides. */
  readonly params?: Record<string, number>;
  /** Explicit signal wiring: portName -> net name. */
  readonly connect?: Record<string, string>;
  /** Override the model's default fidelity for this instance. */
  readonly fidelity?: Fidelity;
}

/** A complete, runnable scenario — the whole thing is JSON-serialisable. */
export interface Scenario {
  readonly version: 1;
  readonly name: string;
  readonly seed: number;
  /** Seconds advanced per step (fixed). */
  readonly timestepSeconds: number;
  readonly durationSeconds: number;
  /** Record a Recording frame every N steps. */
  readonly sampleEverySteps: number;
  /** Commodities available to buses in this scenario. */
  readonly commodities?: CommoditySpec[];
  readonly instances: InstanceSpec[];
  /** Epoch for the sim clock (ms since Unix epoch). Default 0. */
  readonly epochMs?: number;
}
