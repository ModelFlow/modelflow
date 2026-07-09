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

export interface BusSpec {
  name: string;
  commodity: string;
  role: 'offer' | 'request' | 'read';
  band?: number;
  unit?: string;
}

export interface ModelSpec {
  type: string;
  description?: string;
  fidelity: number;
  maxFidelity: number;
  providesBus?: string;
  ports: PortSpec[];
  params: ParamPublicSpec[];
  buses: BusSpec[];
  /** The model's actual logic, as source, for viewing/editing. */
  source: { step?: string; declare?: string; init?: string };
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
  const ports: PortSpec[] = Object.entries(def.ports ?? {}).map(([name, p]) => ({
    name,
    dir: p.dir,
    unit: p.unit,
    dimension: dimOf(p.unit),
    desc: p.desc,
    default: p.default,
    required: p.required,
  }));
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
  const buses: BusSpec[] = Object.entries(def.buses ?? {}).map(([name, b]) => ({
    name,
    commodity: b.commodity,
    role: b.role,
    band: b.band,
    unit: b.unit,
  }));
  return {
    type: def.type,
    description: def.description,
    fidelity: def.fidelity ?? 1,
    maxFidelity: def.maxFidelity ?? 1,
    providesBus: def.providesBus,
    ports,
    params,
    buses,
    source: {
      step: def.step ? def.step.toString() : undefined,
      declare: def.declare ? def.declare.toString() : undefined,
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
