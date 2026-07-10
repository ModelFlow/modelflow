import type { Fidelity, Health, Severity } from './types';
import type { AnyPort } from './signal';
import { isGroupPort } from './signal';
import type { ParamSpec } from './param';
import type { Rng } from './rng';
import { ModelFlowError } from './validate';

/**
 * One member joined to a group port, seen from the HUB. `in` reads the member's
 * driven net (unit-converted); `out` writes the member's read net; `meta` is the
 * per-connection scalars the scenario set (e.g. priority band). This is how a
 * hub model — a bus, a scheduler, a market clearer — loops over "everyone
 * connected to me" in `resolve`.
 */
export interface Channel {
  readonly index: number;
  readonly key: string;
  readonly in: Readonly<Record<string, number>>;
  readonly out: Record<string, number>;
  readonly meta: Readonly<Record<string, number>>;
}

/** A labelled scalar a model exposes for at-a-glance UIs: [label, value, unit]. */
export type KeyFigure = readonly [label: string, value: number, unit: string];

/** Resolve a params-spec object to its numeric value map. */
export type ParamValues<PS> = { [K in keyof PS]: number };

/** Read-only view of an instance, used by subtree aggregation / find. */
export interface ModelInstanceView {
  readonly key: string;
  readonly type: string;
  readonly state: unknown;
  readonly params: Readonly<Record<string, number>>;
  readonly health: Health;
}

/**
 * Everything a model's `step` (and `init`/`declare`) receives. Cursors are
 * plain-named — `in` / `out` / `params` / `state` — deliberately avoiding
 * control-theory `u`/`y` jargon that agents invert.
 */
export interface StepCtx<P = Record<string, number>, S = object> {
  readonly dt: number;
  readonly t: number;
  readonly step: number;
  readonly fidelity: Fidelity;
  readonly params: Readonly<P>;
  /** Arbitrary per-instance state object — read and mutate in place. */
  readonly state: S;
  /** Reads the net bound to each input port. */
  readonly in: Record<string, number>;
  /** Writes the net bound to each output port. */
  readonly out: Record<string, number>;
  readonly rng: Rng;
  /** Members joined to a declared group port, in scenario (deterministic) order. */
  group(name: string): readonly Channel[];
  /** Record an extra time series not tied to a port. */
  emit(seriesId: string, value: number): void;
  log(sev: Severity, msg: string): void;
  /** Sum a field over this instance's subtree (self + all descendants). */
  aggregate(field: (m: ModelInstanceView) => number): number;
}

/**
 * The entire authoring surface. A model is one object literal — no base class,
 * no `super`. Most models implement only `state` + `step`.
 */
export interface ModelDef<
  PS extends Record<string, ParamSpec> = Record<string, ParamSpec>,
  S extends object = object,
> {
  /** Unique class id used to reference this model from a scenario. */
  readonly type: string;
  /** One-line human description for the component catalog. */
  readonly description?: string;
  /** Scalar ports (inPort/outPort) and/or group ports (groupPort). */
  readonly ports?: Record<string, AnyPort>;
  readonly params?: PS;
  /** Fresh state for each instance. */
  readonly state: () => S;
  /** Authoring fidelity if the scenario doesn't override (default 1). */
  readonly fidelity?: Fidelity;
  /** Highest fidelity this model implements (default 1). */
  readonly maxFidelity?: Fidelity;
  /** Env providers step first, so they fill shared nets before consumers read. */
  readonly isEnvProvider?: boolean;

  /** Once, after wiring is resolved. */
  init?(ctx: StepCtx<ParamValues<PS>, S>): void;
  /** Feeders write here: post supply/demand before anyone arbitrates. */
  declare?(ctx: StepCtx<ParamValues<PS>, S>): void;
  /**
   * Coordinators arbitrate here — a bus, scheduler, or market clearer loops over
   * its group members (read their `declare`d values, write back grants). Runs
   * after all `declare`s and before all `step`s.
   */
  resolve?(ctx: StepCtx<ParamValues<PS>, S>): void;
  /** The step: read inputs/grants, do work, write outputs. */
  step(ctx: StepCtx<ParamValues<PS>, S>): void;

  status?(ctx: StepCtx<ParamValues<PS>, S>): string;
  keyFigures?(ctx: StepCtx<ParamValues<PS>, S>): KeyFigure[];
}

/**
 * Registers a model definition, running static author-time checks. The most
 * valuable check: source-scan `step`/`declare`/`init` for `ctx.in.X`/`ctx.out.X`
 * accesses and reject any that don't match a declared port.
 */
export function defineModel<PS extends Record<string, ParamSpec>, S extends object>(
  def: ModelDef<PS, S>,
): ModelDef<PS, S> {
  validateModelDef(def as unknown as ModelDef);
  return def;
}

const FIRST_PARAM = /(?:function\s*\*?\s*[\w$]*\s*)?\(\s*([\w$]+)|^\s*([\w$]+)\s*=>/;

function firstParamName(fn: Function): string | null {
  const src = fn.toString();
  const m = FIRST_PARAM.exec(src);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

export function validateModelDef(def: ModelDef): void {
  if (!def.type || typeof def.type !== 'string') {
    throw new ModelFlowError('A model has no "type" string.');
  }
  if (typeof def.state !== 'function') {
    throw new ModelFlowError(`Model "${def.type}" must define state: () => ({...}).`);
  }
  if (typeof def.step !== 'function') {
    throw new ModelFlowError(`Model "${def.type}" must define a step(ctx) function.`);
  }

  const ports = def.ports ?? {};
  const declared = Object.entries(ports);
  const inNames = new Set(declared.filter(([, p]) => !isGroupPort(p) && p.dir === 'in').map(([n]) => n));
  const outNames = new Set(declared.filter(([, p]) => !isGroupPort(p) && p.dir === 'out').map(([n]) => n));
  const groupNames = new Set(declared.filter(([, p]) => isGroupPort(p)).map(([n]) => n));
  const allPortNames = Object.keys(ports).join(', ') || '(none)';

  const problems: string[] = [];
  for (const fn of [def.step, def.declare, def.resolve, def.init]) {
    if (typeof fn !== 'function') continue;
    const ctxName = firstParamName(fn);
    if (!ctxName) continue;
    const src = fn.toString();
    const re = new RegExp(`\\b${ctxName}\\.(in|out)\\.([A-Za-z_$][\\w$]*)`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const dir = m[1] as 'in' | 'out';
      const name = m[2];
      const ok = dir === 'in' ? inNames.has(name) : outNames.has(name);
      if (!ok) {
        problems.push(`reads ${ctxName}.${dir}.${name} but no ${dir} port "${name}" is declared.`);
      }
    }
    const gre = new RegExp(`\\b${ctxName}\\.group\\(\\s*['"\`]([\\w$]+)['"\`]\\s*\\)`, 'g');
    while ((m = gre.exec(src)) !== null) {
      if (!groupNames.has(m[1])) {
        problems.push(`calls ${ctxName}.group("${m[1]}") but no group port "${m[1]}" is declared.`);
      }
    }
  }
  if (problems.length) {
    throw new ModelFlowError(
      `ModelFlow authoring error in model "${def.type}":\n` +
        problems.map((p) => `  ${p}`).join('\n') +
        `\n  Declared ports: ${allPortNames}`,
    );
  }
}
