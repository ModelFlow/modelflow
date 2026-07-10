import type { Fidelity, Health, Severity } from './types';
import type { Net } from './signal';
import { isGroupPort } from './signal';
import type { ModelDef, ModelInstanceView, StepCtx, Channel } from './model';
import type { Scenario, InstanceSpec } from './scenario';
import type { ModelRegistry } from './registry';
import { CommodityRegistry } from './commodity';
import { History, TimeSeries } from './history';
import { SimClock } from './clock';
import { makeRng, hashSeed, type Rng } from './rng';
import { AggregateValidationError, suggest, type ValidationIssue } from './validate';
import { conversion, parseUnit, describeDimension, dimEqual } from './units';

/** Returns a problem string if two units can't be wired together, else null. */
function unitMismatch(netUnit: string, portUnit: string): string | null {
  // An empty unit is an unspecified "wildcard" — generic primitives adopt
  // whatever they're wired to. Declared units are strict.
  if (netUnit === '' || portUnit === '') return null;
  let a, b;
  try {
    a = parseUnit(netUnit);
  } catch {
    return `unknown unit "${netUnit}"`;
  }
  try {
    b = parseUnit(portUnit);
  } catch {
    return `unknown unit "${portUnit}"`;
  }
  if (!dimEqual(a.dim, b.dim)) {
    return `${portUnit} [${describeDimension(b.dim)}] cannot connect to a net carrying ${netUnit} [${describeDimension(a.dim)}]`;
  }
  return null;
}

/** A staged channel-field binding: which net it aliases + the hub's conversion. */
interface FieldBinding {
  field: string;
  netId: number;
  hubReads: boolean; // hub-in field (getter) vs hub-out field (setter)
  k: number;
  off: number;
}
interface ChannelBinding {
  key: string;
  meta: Record<string, number>;
  fields: FieldBinding[];
}

/** Internal per-instance record. Also serves as the public ModelInstanceView. */
interface Node extends ModelInstanceView {
  key: string;
  type: string;
  def: ModelDef;
  parent: string | null;
  fidelity: Fidelity;
  params: Record<string, number>;
  state: object;
  health: Health;
  rng: Rng;
  inMap: Record<string, number>;
  outMap: Record<string, number>;
  inCursor: Record<string, number>;
  outCursor: Record<string, number>;
  groupBindings: Record<string, ChannelBinding[]>;
  groups: Record<string, Channel[]>;
  ctx: StepCtx;
}

export interface LogEntry {
  step: number;
  t: number;
  key: string;
  sev: Severity;
  msg: string;
}

export interface EngineOptions {
  /** Record time series each step (default true). Turn OFF for sweeps. */
  record?: boolean;
}

/** A node in the introspected wiring graph (for generic UIs). */
export interface GraphNode {
  key: string;
  type: string;
  parent: string | null;
  fidelity: Fidelity;
  health: Health;
  /** Names of any group ports this node hosts (e.g. a bus's "loads"/"sources"). */
  groups?: string[];
}

/** An edge in the introspected wiring graph. */
export interface GraphEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  net: string;
  unit: string;
  /** `signal` = a point-to-point port wire; `group` = a member↔hub group link. */
  kind: 'signal' | 'group';
}

export interface InstanceView {
  key: string;
  type: string;
  parent: string | null;
  fidelity: Fidelity;
  health: Health;
  status: string;
  params: Record<string, number>;
  keyFigures: readonly (readonly [string, number, string])[];
}

/**
 * The simulation engine: flattens a scenario into a wired signal graph and
 * steps it deterministically at a fixed dt. Evaluation order is env-providers
 * first, then declared-instance order (no topological sort). Coordination
 * (buses, schedulers) is not privileged: any model may implement `resolve`,
 * which runs between all `declare`s and all `step`s.
 */
export class Engine {
  readonly clock: SimClock;
  readonly history = new History();
  readonly commodities = new CommodityRegistry();
  readonly logs: LogEntry[] = [];
  readonly record: boolean;

  private buf = new Float64Array(0);
  private nets: Net[] = [];
  private netHandles: TimeSeries[] = [];
  private nodes: Node[] = [];
  private order: Node[] = [];
  private resolvers: Node[] = [];
  private byKey = new Map<string, Node>();
  private children = new Map<string, string[]>();
  private edges: GraphEdge[] = [];
  private scn!: Scenario;

  constructor(
    readonly dt: number,
    epochMs: number,
    private readonly masterSeed: number,
    opts: EngineOptions = {},
  ) {
    this.clock = new SimClock(epochMs, dt);
    this.record = opts.record ?? true;
  }

  get t(): number {
    return this.clock.t;
  }
  get stepIndex(): number {
    return this.clock.step;
  }

  build(scn: Scenario, reg: ModelRegistry): void {
    this.scn = scn;
    for (const c of scn.commodities ?? []) this.commodities.register(c);
    const issues: ValidationIssue[] = [];

    // --- instances -> nodes ---
    const seenKeys = new Set<string>();
    const specs: { spec: InstanceSpec; def: ModelDef }[] = [];
    scn.instances.forEach((spec, idx) => {
      if (seenKeys.has(spec.key)) {
        issues.push({ path: `instances[${idx}].key`, message: `duplicate key "${spec.key}".` });
        return;
      }
      seenKeys.add(spec.key);
      const def = reg.get(spec.type);
      if (!def) {
        const s = suggest(spec.type, reg.types());
        issues.push({
          path: `instances[${idx}].type`,
          message: `unknown model "${spec.type}".${s ? ` Did you mean "${s}"?` : ''}`,
          fix: `registry has: ${reg.types().join(', ') || '(empty)'}`,
        });
        return;
      }
      specs.push({ spec, def });
    });

    for (const { spec } of specs) {
      const parent = spec.parent ?? null;
      if (parent !== null && !seenKeys.has(parent)) {
        issues.push({ path: `instances[${indexOf(scn, spec.key)}].parent`, message: `parent "${parent}" does not exist.` });
      }
    }

    for (const { spec, def } of specs) {
      const node: Node = {
        key: spec.key,
        type: def.type,
        def,
        parent: spec.parent ?? null,
        fidelity: Math.min(spec.fidelity ?? def.fidelity ?? 1, def.maxFidelity ?? 1) as Fidelity,
        params: this.resolveParams(spec, def, indexOf(scn, spec.key), issues),
        state: def.state(),
        health: 'nominal',
        rng: makeRng(hashSeed(this.masterSeed, spec.key)),
        inMap: {},
        outMap: {},
        inCursor: {},
        outCursor: {},
        groupBindings: {},
        groups: {},
        ctx: null as unknown as StepCtx,
      };
      this.nodes.push(node);
      this.byKey.set(node.key, node);
      const sibs = this.children.get(node.parent ?? '') ?? [];
      sibs.push(node.key);
      this.children.set(node.parent ?? '', sibs);
    }

    // --- nets + scalar port wiring ---
    type NetEntry = {
      net: Net;
      hasDriver: boolean;
      readers: number;
      readerPorts: { key: string; portName: string; unit: string }[];
      driverRef?: { key: string; portName: string };
    };
    const netByName = new Map<string, NetEntry>();
    const initVals = new Map<number, number>();
    const getNet = (name: string, unit: string): NetEntry => {
      let e = netByName.get(name);
      if (!e) {
        const net: Net = { id: this.nets.length, name, unit, flow: false };
        this.nets.push(net);
        e = { net, hasDriver: false, readers: 0, readerPorts: [] };
        netByName.set(name, e);
      }
      return e;
    };

    for (const { spec, def } of specs) {
      const node = this.byKey.get(spec.key)!;
      const ports = def.ports ?? {};
      for (const portName of Object.keys(spec.connect ?? {})) {
        if (!ports[portName] || isGroupPort(ports[portName])) {
          const s = suggest(portName, Object.keys(ports));
          issues.push({
            path: `instances[${indexOf(scn, spec.key)}].connect.${portName}`,
            message: `model "${def.type}" has no scalar port "${portName}".${s ? ` Did you mean "${s}"?` : ''}`,
          });
        }
      }
      for (const [portName, anyPort] of Object.entries(ports)) {
        if (isGroupPort(anyPort)) continue; // group ports are wired via `join`
        const port = anyPort;
        const connectedName = spec.connect?.[portName];
        if (connectedName) {
          const e = getNet(connectedName, port.unit);
          if (port.dir === 'out') {
            if (e.hasDriver) {
              issues.push({
                path: `instances[${indexOf(scn, spec.key)}].connect.${portName}`,
                message: `net "${connectedName}" already has a driver; a signal net allows only one output.`,
              });
            }
            e.hasDriver = true;
            e.driverRef = { key: spec.key, portName };
            (e.net as { unit: string }).unit = port.unit;
            node.outMap[portName] = e.net.id;
          } else {
            e.readers++;
            e.readerPorts.push({ key: spec.key, portName, unit: port.unit });
            node.inMap[portName] = e.net.id;
          }
        } else {
          const priv = getNet(`${spec.key}.${portName}`, port.unit);
          if (port.dir === 'out') {
            priv.hasDriver = true;
            priv.driverRef = { key: spec.key, portName };
            node.outMap[portName] = priv.net.id;
          } else {
            if (port.required) {
              issues.push({
                path: `instances[${indexOf(scn, spec.key)}].connect.${portName}`,
                message: `required input "${portName}" of "${def.type}" is not connected.`,
              });
            }
            initVals.set(priv.net.id, port.default ?? 0);
            node.inMap[portName] = priv.net.id;
          }
        }
      }
    }

    // --- group ports: join members to hub group ports (buses, schedulers…) ---
    const groupEdges: GraphEdge[] = [];
    for (const { spec, def } of specs) {
      const memberNode = this.byKey.get(spec.key)!;
      for (const j of spec.join ?? []) {
        const dot = j.group.indexOf('.');
        const hubKey = dot >= 0 ? j.group.slice(0, dot) : j.group;
        const groupName = dot >= 0 ? j.group.slice(dot + 1) : '';
        const hub = this.byKey.get(hubKey);
        const hubPort = hub?.def.ports?.[groupName];
        if (!hub || !hubPort || !isGroupPort(hubPort)) {
          issues.push({ path: `${spec.key}.join`, message: `no group port "${j.group}" (hub "${hubKey}" has no group port "${groupName}").` });
          continue;
        }
        const binding: ChannelBinding = { key: spec.key, meta: Object.freeze({ ...(hubPort.meta ?? {}), ...(j.meta ?? {}) }), fields: [] };
        for (const [field, cf] of Object.entries(hubPort.channel)) {
          const memberPortName = j.wire?.[field] ?? field;
          const memberPort = def.ports?.[memberPortName];
          if (!memberPort || isGroupPort(memberPort)) {
            issues.push({ path: `${spec.key}.join`, message: `channel "${field}" wires to member port "${memberPortName}", which doesn't exist.` });
            continue;
          }
          const hubReads = cf.dir === 'in';
          const wantDir = hubReads ? 'out' : 'in';
          if (memberPort.dir !== wantDir) {
            issues.push({ path: `${spec.key}.join`, message: `group field "${field}" (hub ${cf.dir}) must wire to a member ${wantDir} port; "${memberPortName}" is ${memberPort.dir}.` });
            continue;
          }
          const netId = hubReads ? memberNode.outMap[memberPortName] : memberNode.inMap[memberPortName];
          const net = this.nets[netId];
          let k = 1;
          let off = 0;
          if (hubReads) {
            // hub reads the member's driven net; convert its unit to the field unit
            const problem = unitMismatch(net.unit, cf.unit);
            if (problem) issues.push({ path: `${hubKey}.${groupName}.${field}`, message: `group unit mismatch: ${problem}.` });
            if (cf.unit && net.unit && cf.unit !== net.unit) {
              try {
                const c = conversion(net.unit, cf.unit);
                k = c.k;
                off = c.o;
              } catch {
                /* dimension mismatch already reported */
              }
            }
            groupEdges.push({ id: `g:${hubKey}.${groupName}:${spec.key}.${field}`, source: spec.key, sourcePort: memberPortName, target: hubKey, targetPort: `${groupName}.${field}`, net: net.name, unit: net.unit, kind: 'group' });
          } else {
            // hub drives the member's read net; the hub's field unit is canonical
            (net as { unit: string }).unit = cf.unit;
            const e = netByName.get(net.name);
            if (e) {
              e.hasDriver = true;
              e.driverRef = { key: hubKey, portName: `${groupName}.${field}` };
            }
            groupEdges.push({ id: `g:${hubKey}.${groupName}:${spec.key}.${field}`, source: hubKey, sourcePort: `${groupName}.${field}`, target: spec.key, targetPort: memberPortName, net: net.name, unit: cf.unit, kind: 'group' });
          }
          binding.fields.push({ field, netId, hubReads, k, off });
        }
        (hub.groupBindings[groupName] ??= []).push(binding);
      }
    }

    // --- undriven-net + unit-safety checks ---
    for (const [name, e] of netByName) {
      if (!e.hasDriver && e.readers > 0) {
        issues.push({ path: `net "${name}"`, message: `net "${name}" has readers but no driver (no output port connects to it).` });
      }
      for (const rp of e.readerPorts) {
        const problem = unitMismatch(e.net.unit, rp.unit);
        if (problem) {
          issues.push({
            path: `${rp.key}.${rp.portName}`,
            message: `unit mismatch on net "${name}": ${problem}.`,
            fix: `make the units dimensionally compatible (ModelFlow auto-converts scale, e.g. W↔kW).`,
          });
        }
      }
    }

    if (issues.length) throw new AggregateValidationError(scn.name, issues);

    // --- allocate signal pool + init defaults ---
    this.buf = new Float64Array(this.nets.length);
    for (const [id, v] of initVals) this.buf[id] = v;
    const buf = this.buf;

    // --- cursors (closed over the buffer) + group channels + series ---
    for (const node of this.nodes) {
      node.inCursor = buildInCursor(node, buf, this.nets);
      node.outCursor = buildCursor(node.outMap, buf, true);
      for (const [gname, binds] of Object.entries(node.groupBindings)) {
        node.groups[gname] = binds.map((b, index) => {
          const inRec: Record<string, number> = {};
          const outRec: Record<string, number> = {};
          for (const f of b.fields) {
            if (f.hubReads) chanGetter(inRec, f.field, buf, f.netId, f.k, f.off);
            else chanSetter(outRec, f.field, buf, f.netId);
          }
          return { index, key: b.key, in: inRec, out: outRec, meta: b.meta };
        });
      }
    }
    if (this.record) {
      this.netHandles = this.nets.map((n) => this.history.ensure(n.name, n.name, n.unit));
    }

    // --- eval order + resolvers + ctx + init ---
    this.order = [
      ...this.nodes.filter((n) => n.def.isEnvProvider),
      ...this.nodes.filter((n) => !n.def.isEnvProvider),
    ];
    this.resolvers = this.order.filter((n) => typeof n.def.resolve === 'function');
    for (const node of this.nodes) node.ctx = new Ctx(this, node);
    for (const node of this.order) node.def.init?.(node.ctx);

    // --- introspection graph: signal edges + group edges ---
    for (const [name, e] of netByName) {
      if (!e.driverRef) continue;
      for (const rp of e.readerPorts) {
        this.edges.push({
          id: `s:${name}:${rp.key}.${rp.portName}`,
          source: e.driverRef.key,
          sourcePort: e.driverRef.portName,
          target: rp.key,
          targetPort: rp.portName,
          net: name,
          unit: e.net.unit,
          kind: 'signal',
        });
      }
    }
    this.edges.push(...groupEdges);
  }

  /** The wiring graph — nodes + typed edges — for a generic inspector UI. */
  structure(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: this.nodes.map((n) => {
        const groups = Object.entries(n.def.ports ?? {})
          .filter(([, p]) => isGroupPort(p))
          .map(([name]) => name);
        return {
          key: n.key,
          type: n.type,
          parent: n.parent,
          fidelity: n.fidelity,
          health: n.health,
          groups: groups.length ? groups : undefined,
        };
      }),
      edges: this.edges,
    };
  }

  /** Live per-instance snapshot (params, status, key figures) for asset tables. */
  instanceViews(): InstanceView[] {
    return this.nodes.map((n) => ({
      key: n.key,
      type: n.type,
      parent: n.parent,
      fidelity: n.fidelity,
      health: n.health,
      status: n.def.status?.(n.ctx) ?? 'nominal',
      params: { ...n.params },
      keyFigures: n.def.keyFigures?.(n.ctx) ?? [],
    }));
  }

  private resolveParams(spec: InstanceSpec, def: ModelDef, idx: number, issues: ValidationIssue[]): Record<string, number> {
    const out: Record<string, number> = {};
    const specs = def.params ?? {};
    for (const [k, ps] of Object.entries(specs)) out[k] = ps.value;
    for (const [k, v] of Object.entries(spec.params ?? {})) {
      if (!(k in specs)) {
        const s = suggest(k, Object.keys(specs));
        issues.push({ path: `instances[${idx}].params.${k}`, message: `model "${def.type}" has no param "${k}".${s ? ` Did you mean "${s}"?` : ''}` });
        continue;
      }
      const ps = specs[k];
      if ((ps.min !== undefined && v < ps.min) || (ps.max !== undefined && v > ps.max)) {
        issues.push({ path: `instances[${idx}].params.${k}`, message: `value ${v} out of range [${ps.min ?? '-∞'}, ${ps.max ?? '∞'}] for "${def.type}".` });
      }
      out[k] = v;
    }
    return out;
  }

  /**
   * Advance one fixed timestep. Feeders write in `declare`, coordinators
   * arbitrate in `resolve`, consumers read in `step` — the generic replacement
   * for the old engine-privileged bus phase.
   */
  step(): void {
    const order = this.order;
    for (const n of order) if (n.def.isEnvProvider) n.def.declare?.(n.ctx);
    for (const n of order) if (n.def.isEnvProvider) n.def.step(n.ctx);
    for (const n of order) if (!n.def.isEnvProvider) n.def.declare?.(n.ctx);
    for (const n of this.resolvers) n.def.resolve!(n.ctx);
    for (const n of order) if (!n.def.isEnvProvider) n.def.step(n.ctx);
    if (this.record) {
      const buf = this.buf;
      const nets = this.nets;
      const hs = this.netHandles;
      for (let i = 0; i < hs.length; i++) hs[i].stage(buf[nets[i].id]);
      this.history.commitStep();
    }
    this.clock.advance();
  }

  run(steps?: number): void {
    const n = steps ?? Math.round(this.scn.durationSeconds / this.dt);
    for (let i = 0; i < n; i++) this.step();
  }

  aggregate(key: string, f: (m: ModelInstanceView) => number): number {
    let sum = 0;
    const stack = [key];
    while (stack.length) {
      const k = stack.pop()!;
      const node = this.byKey.get(k);
      if (node) sum += f(node);
      const kids = this.children.get(k);
      if (kids) stack.push(...kids);
    }
    return sum;
  }

  reparent(key: string, newParent: string | null): void {
    const node = this.byKey.get(key);
    if (!node) throw new Error(`reparent: unknown key "${key}"`);
    const old = this.children.get(node.parent ?? '');
    if (old) this.children.set(node.parent ?? '', old.filter((k) => k !== key));
    node.parent = newParent;
    const sibs = this.children.get(newParent ?? '') ?? [];
    sibs.push(key);
    this.children.set(newParent ?? '', sibs);
  }

  find(pred: (m: ModelInstanceView) => boolean): ModelInstanceView | undefined {
    return this.nodes.find(pred);
  }

  /** Direct read of a net's current value (test/metric/debug). */
  netValue(name: string): number {
    const net = this.nets.find((n) => n.name === name);
    return net ? this.buf[net.id] : NaN;
  }

  emitLog(key: string, sev: Severity, msg: string): void {
    this.logs.push({ step: this.clock.step, t: this.clock.t, key, sev, msg });
  }

  get allNodes(): readonly ModelInstanceView[] {
    return this.nodes;
  }
}

function indexOf(scn: Scenario, key: string): number {
  return scn.instances.findIndex((s) => s.key === key);
}

function chanGetter(o: Record<string, number>, field: string, buf: Float64Array, id: number, k: number, off: number): void {
  if (k === 1 && off === 0) Object.defineProperty(o, field, { get: () => buf[id], enumerable: true });
  else if (off === 0) Object.defineProperty(o, field, { get: () => buf[id] * k, enumerable: true });
  else Object.defineProperty(o, field, { get: () => buf[id] * k + off, enumerable: true });
}
function chanSetter(o: Record<string, number>, field: string, buf: Float64Array, id: number): void {
  Object.defineProperty(o, field, {
    get: () => buf[id],
    set: (v: number) => {
      buf[id] = v;
    },
    enumerable: true,
  });
}

function buildCursor(map: Record<string, number>, buf: Float64Array, writable: boolean): Record<string, number> {
  const o: Record<string, number> = {};
  for (const name in map) {
    const id = map[name];
    if (writable) {
      Object.defineProperty(o, name, {
        get: () => buf[id],
        set: (v: number) => {
          buf[id] = v;
        },
        enumerable: true,
      });
    } else {
      Object.defineProperty(o, name, { get: () => buf[id], enumerable: true });
    }
  }
  return o;
}

/**
 * Input cursor with automatic unit conversion. The buffer holds each net's
 * value in the driver's (canonical) unit; a reader whose port declares a
 * different-but-compatible unit gets it converted on read.
 */
function buildInCursor(node: Node, buf: Float64Array, nets: Net[]): Record<string, number> {
  const o: Record<string, number> = {};
  const ports = node.def.ports ?? {};
  for (const name in node.inMap) {
    const id = node.inMap[name];
    const p = ports[name];
    const portUnit = p && !isGroupPort(p) ? p.unit : '';
    const netUnit = nets[id].unit;
    let k = 1;
    let off = 0;
    if (portUnit !== netUnit && portUnit !== '' && netUnit !== '') {
      try {
        const c = conversion(netUnit, portUnit);
        k = c.k;
        off = c.o;
      } catch {
        /* dimension mismatch already reported as an issue */
      }
    }
    if (k === 1 && off === 0) Object.defineProperty(o, name, { get: () => buf[id], enumerable: true });
    else if (off === 0) Object.defineProperty(o, name, { get: () => buf[id] * k, enumerable: true });
    else Object.defineProperty(o, name, { get: () => buf[id] * k + off, enumerable: true });
  }
  return o;
}

/** Per-instance step context; built once, delegates live time to the engine. */
class Ctx implements StepCtx {
  readonly in: Record<string, number>;
  readonly out: Record<string, number>;
  readonly params: Record<string, number>;
  readonly state: object;
  readonly rng: Rng;
  constructor(
    private readonly eng: Engine,
    private readonly node: Node,
  ) {
    this.in = node.inCursor;
    this.out = node.outCursor;
    this.params = node.params;
    this.state = node.state;
    this.rng = node.rng;
  }
  get dt(): number {
    return this.eng.dt;
  }
  get t(): number {
    return this.eng.clock.t;
  }
  get step(): number {
    return this.eng.clock.step;
  }
  get fidelity(): Fidelity {
    return this.node.fidelity;
  }
  group(name: string): readonly Channel[] {
    return this.node.groups[name] ?? EMPTY;
  }
  emit(id: string, value: number): void {
    if (this.eng.record) this.eng.history.record(id, id, '', value);
  }
  log(sev: Severity, msg: string): void {
    this.eng.emitLog(this.node.key, sev, msg);
  }
  aggregate(field: (m: ModelInstanceView) => number): number {
    return this.eng.aggregate(this.node.key, field);
  }
}
const EMPTY: readonly Channel[] = Object.freeze([]);
