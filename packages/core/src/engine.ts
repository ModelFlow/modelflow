import type { Fidelity, Health, Severity } from './types';
import type { Net } from './signal';
import type { ModelDef, ModelInstanceView, StepCtx } from './model';
import type { Scenario, InstanceSpec } from './scenario';
import type { ModelRegistry } from './registry';
import type { AllocationPolicy, BusAttach, BusHandle, BusRequest, ReserveView } from './bus';
import { CommodityRegistry } from './commodity';
import { History, TimeSeries } from './history';
import { SimClock } from './clock';
import { makeRng, hashSeed, type Rng } from './rng';
import { AggregateValidationError, suggest, type ValidationIssue } from './validate';
import { conversion, parseUnit, describeDimension, dimEqual } from './units';

/** Returns a problem string if two units can't be wired together, else null. */
function unitMismatch(netUnit: string, portUnit: string): string | null {
  // An empty unit is an unspecified "wildcard" — generic primitives (Source,
  // Controller…) adopt whatever they're wired to. Declared units are strict.
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

/** Live handle backing `ctx.bus.<name>`; zero-alloc, reads/writes bus accumulators. */
class BusHandleImpl implements BusHandle {
  offer = 0;
  demand = 0;
  band: number;
  reqIndex = -1;
  bus: CompiledBus;
  constructor(
    bus: CompiledBus,
    readonly attach: BusAttach,
  ) {
    this.bus = bus;
    this.band = attach.band ?? 0;
  }
  get granted(): number {
    return this.reqIndex >= 0 ? this.bus.grantFractions[this.reqIndex] : 0;
  }
  get served(): number {
    return this.demand * this.granted;
  }
  get level(): number {
    return this.bus.reserve ? this.bus.reserve.level : 0;
  }
}

/** One arbitrated bus for a commodity, owned by a node's subtree. */
class CompiledBus {
  readonly offerHandles: BusHandleImpl[] = [];
  readonly requestHandles: BusHandleImpl[] = [];
  readonly readHandles: BusHandleImpl[] = [];
  grantFractions = new Float64Array(0);
  private reqs: BusRequest[] = [];
  reserve: ReserveView | null = null;
  // Direct series handles (null when recording is off).
  private tsOffered: TimeSeries | null = null;
  private tsDemanded: TimeSeries | null = null;
  private tsServed: TimeSeries | null = null;
  private tsUnmet: TimeSeries | null = null;

  constructor(
    readonly commodity: string,
    readonly ownerKey: string,
    readonly policy: AllocationPolicy | null,
  ) {}

  finalize(): void {
    const n = this.requestHandles.length;
    this.grantFractions = new Float64Array(n);
    this.reqs = this.requestHandles.map((h, i) => {
      h.reqIndex = i;
      return { amount: 0, band: h.band, tag: h.attach.tag ?? '' };
    });
  }

  bindSeries(history: History): void {
    const c = this.commodity;
    this.tsOffered = history.ensure(`bus.${c}.offered`, `bus.${c}.offered`, '');
    this.tsDemanded = history.ensure(`bus.${c}.demanded`, `bus.${c}.demanded`, '');
    this.tsServed = history.ensure(`bus.${c}.served`, `bus.${c}.served`, '');
    this.tsUnmet = history.ensure(`bus.${c}.unmet`, `bus.${c}.unmet`, '');
  }

  begin(): void {
    for (const h of this.offerHandles) h.offer = 0;
    for (const h of this.requestHandles) h.demand = 0;
  }

  resolve(dt: number): void {
    let supply = 0;
    for (const h of this.offerHandles) supply += h.offer;
    let demanded = 0;
    for (let i = 0; i < this.requestHandles.length; i++) {
      const h = this.requestHandles[i];
      this.reqs[i].amount = h.demand;
      this.reqs[i].band = h.band;
      demanded += h.demand;
    }
    const fr = this.policy
      ? this.policy.allocate(supply, this.reqs, this.reserve, dt)
      : proRata(supply, demanded, this.reqs.length);
    this.grantFractions.set(fr);
    if (this.tsOffered) {
      let served = 0;
      for (let i = 0; i < this.reqs.length; i++) served += this.grantFractions[i] * this.reqs[i].amount;
      this.tsOffered.stage(supply);
      this.tsDemanded!.stage(demanded);
      this.tsServed!.stage(served);
      this.tsUnmet!.stage(Math.max(0, demanded - served));
    }
  }
}

const _proRataBuf = { arr: new Float64Array(0) };
function proRata(supply: number, demanded: number, n: number): Float64Array {
  if (_proRataBuf.arr.length !== n) _proRataBuf.arr = new Float64Array(n);
  const f = demanded > 0 ? Math.min(1, supply / demanded) : 0;
  _proRataBuf.arr.fill(f);
  return _proRataBuf.arr;
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
  busHandles: Record<string, BusHandle>;
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

/**
 * The simulation engine: flattens a scenario into a wired signal graph and
 * steps it deterministically at a fixed dt. Evaluation order is env-providers
 * first, then declared-instance order (no topological sort) — the property that
 * makes runs reproducible and re-parenting safe.
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
  private byKey = new Map<string, Node>();
  private children = new Map<string, string[]>();
  private buses: CompiledBus[] = [];
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

    // --- create nodes (params resolved; wiring maps filled below) ---
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
        busHandles: {},
        ctx: null as unknown as StepCtx,
      };
      this.nodes.push(node);
      this.byKey.set(node.key, node);
      const sibs = this.children.get(node.parent ?? '') ?? [];
      sibs.push(node.key);
      this.children.set(node.parent ?? '', sibs);
    }

    // --- nets + port wiring ---
    type NetEntry = {
      net: Net;
      hasDriver: boolean;
      readers: number;
      readerPorts: { key: string; portName: string; unit: string }[];
    };
    const netByName = new Map<string, NetEntry>();
    const initVals = new Map<number, number>();
    const getNet = (name: string, unit: string, flow: boolean): NetEntry => {
      let e = netByName.get(name);
      if (!e) {
        const net: Net = { id: this.nets.length, name, unit, flow };
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
        if (!ports[portName]) {
          const s = suggest(portName, Object.keys(ports));
          issues.push({
            path: `instances[${indexOf(scn, spec.key)}].connect.${portName}`,
            message: `model "${def.type}" has no port "${portName}".${s ? ` Did you mean "${s}"?` : ''}`,
          });
        }
      }
      for (const [portName, port] of Object.entries(ports)) {
        const connectedName = spec.connect?.[portName];
        if (connectedName) {
          const e = getNet(connectedName, port.unit, false);
          if (port.dir === 'out') {
            if (e.hasDriver) {
              issues.push({
                path: `instances[${indexOf(scn, spec.key)}].connect.${portName}`,
                message: `net "${connectedName}" already has a driver; a signal net allows only one output.`,
              });
            }
            e.hasDriver = true;
            // The driver's output unit is the net's canonical unit; readers convert to it.
            (e.net as { unit: string }).unit = port.unit;
            node.outMap[portName] = e.net.id;
          } else {
            e.readers++;
            e.readerPorts.push({ key: spec.key, portName, unit: port.unit });
            node.inMap[portName] = e.net.id;
          }
        } else {
          const priv = getNet(`${spec.key}.${portName}`, port.unit, false);
          if (port.dir === 'out') {
            priv.hasDriver = true;
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

    for (const [name, e] of netByName) {
      if (!e.net.flow && !e.hasDriver && e.readers > 0) {
        issues.push({ path: `net "${name}"`, message: `net "${name}" has readers but no driver (no output port connects to it).` });
      }
      // Unit-safety: every reader must be dimensionally compatible with the net.
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

    // --- buses: owners then nearest-owner attachment binding ---
    for (const node of this.nodes) {
      if (node.def.providesBus) {
        this.buses.push(new CompiledBus(node.def.providesBus, node.key, node.def.policy ?? null));
      }
    }
    for (const node of this.nodes) {
      for (const [attachName, attach] of Object.entries(node.def.buses ?? {})) {
        const owner = this.nearestBus(node.key, attach.commodity);
        if (!owner) {
          issues.push({
            path: `model "${node.type}" (${node.key})`,
            message: `attaches to commodity "${attach.commodity}" but no ancestor provides that bus.`,
            fix: `add an arbitratedBus('${attach.commodity}') at or above "${node.parent ?? 'root'}".`,
          });
          continue;
        }
        const h = new BusHandleImpl(owner, attach);
        node.busHandles[attachName] = h;
        if (attach.role === 'offer') owner.offerHandles.push(h);
        else if (attach.role === 'request') owner.requestHandles.push(h);
        else owner.readHandles.push(h);
      }
    }
    for (const b of this.buses) b.finalize();

    if (issues.length) throw new AggregateValidationError(scn.name, issues);

    // --- allocate signal pool + init defaults ---
    this.buf = new Float64Array(this.nets.length);
    for (const [id, v] of initVals) this.buf[id] = v;
    const buf = this.buf;

    // --- cursors (closed over the concrete buffer) + series handles ---
    for (const node of this.nodes) {
      node.inCursor = buildInCursor(node, buf, this.nets);
      node.outCursor = buildCursor(node.outMap, buf, true);
    }
    if (this.record) {
      this.netHandles = this.nets.map((n) => this.history.ensure(n.name, n.name, n.unit));
      for (const b of this.buses) b.bindSeries(this.history);
    }

    // --- eval order + ctx + init ---
    this.order = [
      ...this.nodes.filter((n) => n.def.isEnvProvider),
      ...this.nodes.filter((n) => !n.def.isEnvProvider),
    ];
    for (const node of this.nodes) node.ctx = new Ctx(this, node);
    for (const node of this.order) node.def.init?.(node.ctx);
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

  private nearestBus(key: string, commodity: string): CompiledBus | null {
    let cur: string | null = key;
    while (cur !== null) {
      const owner = this.buses.find((b) => b.ownerKey === cur && b.commodity === commodity);
      if (owner) return owner;
      cur = this.byKey.get(cur)?.parent ?? null;
    }
    return null;
  }

  /** Advance one fixed timestep. */
  step(): void {
    const dt = this.dt;
    const order = this.order;
    for (const b of this.buses) b.begin();
    for (const n of order) if (n.def.isEnvProvider) n.def.declare?.(n.ctx);
    for (const n of order) if (n.def.isEnvProvider) n.def.step(n.ctx);
    for (const n of order) if (!n.def.isEnvProvider) n.def.declare?.(n.ctx);
    for (const b of this.buses) b.resolve(dt);
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
    this.rebindBuses();
  }

  private rebindBuses(): void {
    for (const b of this.buses) {
      b.offerHandles.length = 0;
      b.requestHandles.length = 0;
      b.readHandles.length = 0;
    }
    for (const node of this.nodes) {
      for (const [attachName, attach] of Object.entries(node.def.buses ?? {})) {
        const owner = this.nearestBus(node.key, attach.commodity);
        if (!owner) continue;
        const h = node.busHandles[attachName] as BusHandleImpl;
        h.bus = owner;
        if (attach.role === 'offer') owner.offerHandles.push(h);
        else if (attach.role === 'request') owner.requestHandles.push(h);
        else owner.readHandles.push(h);
      }
    }
    for (const b of this.buses) b.finalize();
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
 * different-but-compatible unit gets it converted on read. Identity reads keep
 * the bare `buf[id]` fast path; scale-only reads are one multiply.
 */
function buildInCursor(node: Node, buf: Float64Array, nets: Net[]): Record<string, number> {
  const o: Record<string, number> = {};
  const ports = node.def.ports ?? {};
  for (const name in node.inMap) {
    const id = node.inMap[name];
    const portUnit = ports[name]?.unit ?? '';
    const netUnit = nets[id].unit;
    let k = 1;
    let off = 0;
    // '' is a wildcard (passthrough); only convert when both units are declared.
    if (portUnit !== netUnit && portUnit !== '' && netUnit !== '') {
      try {
        const c = conversion(netUnit, portUnit);
        k = c.k;
        off = c.o;
      } catch {
        // Left identity; a dimension mismatch was already reported as an issue.
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
  readonly bus: Record<string, BusHandle>;
  readonly params: Record<string, number>;
  readonly state: object;
  readonly rng: Rng;
  constructor(
    private readonly eng: Engine,
    private readonly node: Node,
  ) {
    this.in = node.inCursor;
    this.out = node.outCursor;
    this.bus = node.busHandles;
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
