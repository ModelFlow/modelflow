/**
 * Publishable component descriptors. `modelSpec` turns a ModelDef into a clean,
 * self-describing spec — every port and param annotated with its unit AND the
 * physical dimension that unit represents — so a component (e.g. a solar panel:
 * irradiance in → power out) can be published, browsed, and dropped into any
 * other simulation with its interface fully understood.
 */
import type { ModelDef } from './model';
import type { ModelRegistry } from './registry';
import type { ParamSource } from './param';
import { isGroupPort } from './signal';
import { parseUnit, describeDimension } from './units';

export interface PortSpec {
  name: string;
  dir: 'in' | 'out';
  unit: string;
  dimension: string;
  desc?: string;
  default?: number;
  required?: boolean;
}

/** A dynamic-arity group port (e.g. a bus's "loads") in a published spec. */
export interface GroupPortSpec {
  name: string;
  desc?: string;
  channel: { field: string; dir: 'in' | 'out'; unit: string; dimension: string }[];
  meta?: Record<string, number>;
}

export interface ParamPublicSpec {
  name: string;
  value: number;
  unit: string;
  dimension: string;
  desc: string;
  notes?: string;
  source?: string;
  sourceUrl?: string;
  sources?: ParamSource[];
  confidence?: 'low' | 'med' | 'high';
  min?: number;
  max?: number;
}

export interface ModelSpec {
  type: string;
  description?: string;
  fidelity: number;
  maxFidelity: number;
  ports: PortSpec[];
  groupPorts: GroupPortSpec[];
  params: ParamPublicSpec[];
  /** The model's actual logic, as source, for viewing/editing. */
  source: { step?: string; declare?: string; resolve?: string; init?: string };
}

function dimOf(unit: string): string {
  try {
    return describeDimension(parseUnit(unit).dim);
  } catch {
    return 'unknown';
  }
}

/** Describe one model as a publishable component spec. */
export function modelSpec(def: ModelDef): ModelSpec {
  const entries = Object.entries(def.ports ?? {});
  const ports: PortSpec[] = entries
    .filter(([, p]) => !isGroupPort(p))
    .map(([name, p]) => {
      const sp = p as { dir: 'in' | 'out'; unit: string; desc?: string; default?: number; required?: boolean };
      return { name, dir: sp.dir, unit: sp.unit, dimension: dimOf(sp.unit), desc: sp.desc, default: sp.default, required: sp.required };
    });
  const groupPorts: GroupPortSpec[] = entries
    .filter(([, p]) => isGroupPort(p))
    .map(([name, p]) => {
      const gp = p as { channel: Record<string, { dir: 'in' | 'out'; unit: string }>; meta?: Record<string, number>; desc?: string };
      return {
        name,
        desc: gp.desc,
        meta: gp.meta,
        channel: Object.entries(gp.channel).map(([field, cf]) => ({ field, dir: cf.dir, unit: cf.unit, dimension: dimOf(cf.unit) })),
      };
    });
  const params: ParamPublicSpec[] = Object.entries(def.params ?? {}).map(([name, ps]) => ({
    name,
    value: ps.value,
    unit: ps.unit,
    dimension: dimOf(ps.unit),
    desc: ps.desc,
    notes: ps.notes,
    source: ps.source,
    sourceUrl: ps.sourceUrl,
    sources: ps.sources,
    confidence: ps.confidence,
    min: ps.min,
    max: ps.max,
  }));
  return {
    type: def.type,
    description: def.description,
    fidelity: def.fidelity ?? 1,
    maxFidelity: def.maxFidelity ?? 1,
    ports,
    groupPorts,
    params,
    source: {
      step: def.step ? def.step.toString() : undefined,
      declare: def.declare ? def.declare.toString() : undefined,
      resolve: def.resolve ? def.resolve.toString() : undefined,
      init: def.init ? def.init.toString() : undefined,
    },
  };
}

/** Describe every model in a registry — the component catalog for publishing. */
export function catalog(reg: ModelRegistry): ModelSpec[] {
  return reg
    .types()
    .map((t) => reg.get(t)!)
    .map(modelSpec);
}
