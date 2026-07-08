import type { Fidelity, Health, Severity } from './types';
import type { Net } from './signal';
import type { ModelDef, ModelInstanceView, StepCtx } from './model';
import type { Scenario, InstanceSpec } from './scenario';
import type { ModelRegistry } from './registry';
import type { AllocationPolicy, BusAttach, BusHandle, BusRequest, ReserveView } from './bus';
import { CommodityRegistry } from './commodity';
import { History } from './history';
import { SimClock } from './clock';
import { makeRng, hashSeed, type Rng } from './rng';
import { AggregateValidationError, suggest, type ValidationIssue } from './validate';

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

  constructor(
    readonly commodity: string,
    readonly ownerKey: string,
    readonly policy: AllocationPolicy | null,
  ) {}

  /** After all handles attached: fix request indices + preallocate buffers. */
  finalize(): void {
    const n = this.requestHandles.length;
    this.grantFractions = new Float64Array(n);
    this.reqs = this.requestHandles.map((h, i) => {
      h.reqIndex = i;
      return { amount: 0, band: h.attach.band ?? 0, tag: h.attach.tag ?? '' };
    });
  }

  begin(): void {
    for (const h of this.offerHandles) h.offer = 0;
    for (const h of this.requestHandles) h.demand = 0;
  }

  resolve(dt: number, history: History): void {
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
    let served = 0;
    for (let i = 0; i < this.reqs.length; i++) served += this.grantFractions[i] * this.reqs[i].amount;
    const c = this.commodity;
    history.record(`bus.${c}.offered`, `bus.${c}.offered`, '', supply);
    history.record(`bus.${c}.demanded`, `bus.${c}.demanded`, '', demanded);
    history.record(`bus.${c}.served`, `bus.${c}.served`, '', served);
    history.record(`bus.${c}.unmet`, `bus.${c}.unmet`, '', Math.max(0, demanded - served));
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

  private buf = new Float64Array(0);
  private nets: Net[] = [];
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
  ) {
    this.clock = new SimClock(epochMs, dt);
  }

  get t(): number {
    return this.clock.t;
  }
  get stepIndex(): number {
    return this.clock.step;
  }

  /** Flatten hierarchy, resolve wiring + nearest-owner buses, validate, init. */
  build(scn: Scenario, reg: ModelRegistry): void {
    this.scn = scn;
    for (const c of scn.commodities ?? []) this.commodities.register(c);
    const issues: ValidationIssue[] = [];

    // --- instances -> nodes ---
    const seenKeys = new Set<string>();
    const specs: { spec: InstanceSpec; def: ModelDef; idx: number }[] = [];
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
      specs.push({ spec, def, idx });
    });

    // --- parent validation + children map ---
    for (const { spec, idx } of specs) {
      const parent = spec.parent ?? null;
      if (parent !== null && !seenKeys.has(parent)) {
        issues.push({ path: `instances[${idx}].parent`, message: `parent "${parent}" does not exist.` });
      }
    }

    // --- nets (explicit connect names + private per-port nets) ---
    const netByName = new Map<string, { net: Net; hasDriver: boolean; readers: number }>();
    const initVals = new Map<number, number>();
    const getNet = (name: string, unit: string, flow: boolean): { net: Net; hasDriver: boolean; readers: number } => {
      let e = netByName.get(name);
      if (!e) {
        const net: Net = { id: this.nets.length, name, unit, flow };
        this.nets.push(net);
        e = { net, hasDriver: false, readers: 0 };
        netByName.set(name, e);
      }
      return e;
    };

    // Pre-create nodes (without cursors) so params resolve before wiring.
    for (const { spec, def, idx } of specs) {
      const params = this.resolveParams(spec, def, idx, issues);
      const node: Node = {
        key: spec.key,
        type: def.type,
        def,
        parent: spec.parent ?? null,
        fidelity: Math.min(spec.fidelity ?? def.fidelity ?? 1, def.maxFidelity ?? 1) as Fidelity,
        params,
        state: def.state(),
        health: 'nominal',
        rng: makeRng(hashSeed(this.masterSeed, spec.key)),
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

    // Wire ports to nets.
    for (const { spec, def } of specs) {
      const node = this.byKey.get(spec.key)!;
      const ports = def.ports ?? {};
      // validate connect keys reference real ports
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
            node.outCursor = defineOut(node.outCursor, portName, e.net.id, this);
          } else {
            e.readers++;
            node.inCursor = defineIn(node.inCursor, portName, e.net.id, this);
          }
        } else {
          // unconnected -> private net
          const priv = getNet(`${spec.key}.${portName}`, port.unit, false);
          if (port.dir === 'out') {
            priv.hasDriver = true;
            node.outCursor = defineOut(node.outCursor, portName, priv.net.id, this);
          } else {
            if (port.required) {
              issues.push({
                path: `instances[${indexOf(scn, spec.key)}].connect.${portName}`,
                message: `required input "${portName}" of "${def.type}" is not connected.`,
              });
            }
            initVals.set(priv.net.id, port.default ?? 0);
            node.inCursor = defineIn(node.inCursor, portName, priv.net.id, this);
          }
        }
      }
    }

    // Undriven shared nets (readers but no output writes them).
    for (const [name, e] of netByName) {
      if (!e.net.flow && !e.hasDriver && e.readers > 0) {
        issues.push({
          path: `net "${name}"`,
          message: `net "${name}" has readers but no driver (no output port connects to it).`,
        });
      }
    }

    // --- buses: create owners, then bind attachments to nearest owner ---
    const busOwners = new Map<string, CompiledBus[]>(); // commodity -> owners (any depth)
    for (const node of this.nodes) {
      if (node.def.providesBus) {
        const cb = new CompiledBus(node.def.providesBus, node.key, node.def.policy ?? null);
        this.buses.push(cb);
        const arr = busOwners.get(node.def.providesBus) ?? [];
        arr.push(cb);
        busOwners.set(node.def.providesBus, arr);
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

    // --- eval order: env providers first, else instance order ---
    this.order = [
      ...this.nodes.filter((n) => n.def.isEnvProvider),
      ...this.nodes.filter((n) => !n.def.isEnvProvider),
    ];

    // --- build ctx + run init ---
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
        issues.push({
          path: `instances[${idx}].params.${k}`,
          message: `model "${def.type}" has no param "${k}".${s ? ` Did you mean "${s}"?` : ''}`,
        });
        continue;
      }
      const ps = specs[k];
      if ((ps.min !== undefined && v < ps.min) || (ps.max !== undefined && v > ps.max)) {
        issues.push({
          path: `instances[${idx}].params.${k}`,
          message: `value ${v} out of range [${ps.min ?? '-∞'}, ${ps.max ?? '∞'}] for "${def.type}".`,
        });
      }
      out[k] = v;
    }
    return out;
  }

  /** Walk up the parent chain (incl. self) to the closest bus for a commodity. */
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
    for (const b of this.buses) b.begin();
    for (const n of this.order) if (n.def.isEnvProvider) n.def.declare?.(n.ctx);
    for (const n of this.order) if (n.def.isEnvProvider) n.def.step(n.ctx);
    for (const n of this.order) if (!n.def.isEnvProvider) n.def.declare?.(n.ctx);
    for (const b of this.buses) b.resolve(dt, this.history);
    for (const n of this.order) if (!n.def.isEnvProvider) n.def.step(n.ctx);
    for (const net of this.nets) this.history.record(net.name, net.name, net.unit, this.buf[net.id]);
    this.history.commitStep();
    this.clock.advance();
  }

  /** Run to the scenario's duration (or a given step count). */
  run(steps?: number): void {
    const n = steps ?? Math.round(this.scn.durationSeconds / this.dt);
    for (let i = 0; i < n; i++) this.step();
  }

  /** Sum `f` over the subtree rooted at `key` (self + all descendants). */
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

  /** Move a node (and its subtree) to a new parent mid-sim; rebind its buses. */
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
        (h as { bus: CompiledBus }).bus = owner;
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

  /** Direct read of a net's current value (test/debug). */
  netValue(name: string): number {
    const net = this.nets.find((n) => n.name === name);
    return net ? this.buf[net.id] : NaN;
  }

  emitLog(key: string, sev: Severity, msg: string): void {
    this.logs.push({ step: this.clock.step, t: this.clock.t, key, sev, msg });
  }

  /** Read-only accessors for the emitter (Phase 1). */
  get allNodes(): readonly ModelInstanceView[] {
    return this.nodes;
  }
  bufRef(): Float64Array {
    return this.buf;
  }
  netId(name: string): number {
    return this.nets.find((n) => n.name === name)?.id ?? -1;
  }
}

function indexOf(scn: Scenario, key: string): number {
  return scn.instances.findIndex((s) => s.key === key);
}

function defineIn(obj: Record<string, number>, name: string, id: number, eng: Engine): Record<string, number> {
  Object.defineProperty(obj, name, { get: () => eng.bufRef()[id], enumerable: true, configurable: true });
  return obj;
}
function defineOut(obj: Record<string, number>, name: string, id: number, eng: Engine): Record<string, number> {
  Object.defineProperty(obj, name, {
    get: () => eng.bufRef()[id],
    set: (v: number) => {
      eng.bufRef()[id] = v;
    },
    enumerable: true,
    configurable: true,
  });
  return obj;
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
    this.eng.history.record(id, id, '', value);
  }
  log(sev: Severity, msg: string): void {
    this.eng.emitLog(this.node.key, sev, msg);
  }
  aggregate(field: (m: ModelInstanceView) => number): number {
    return this.eng.aggregate(this.node.key, field);
  }
}
