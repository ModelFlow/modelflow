import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Engine, catalog, modelSpec, type ModelDef, type ModelSpec, type InstanceView } from '@modelflow/core';
import { microgrid, microgridRegistry } from './demo';
import { layeredLayout } from './layout';
import { Scope, type Trace } from './Scope';
import { Tornado } from './Tornado';
import { sensitivity, type SensiResult } from './sensitivity';
import './theme.css';

const STEP_H = microgrid.timestepSeconds / 3600; // hours of simulated time per step

const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtInt = (v: number) => Math.round(v).toLocaleString();

// A run speed = target simulation steps per real second. ⏸ = 0, Max = uncapped.
const SPEEDS = [
  { label: '⏸', sps: 0 },
  { label: '1×', sps: 12 },
  { label: '4×', sps: 48 },
  { label: '20×', sps: 240 },
  { label: '100×', sps: 1200 },
  { label: 'Max', sps: Infinity },
];
const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];
const WINDOW = 220;

function buildEngine(fid: Record<string, number> = {}): Engine {
  const scn =
    Object.keys(fid).length > 0
      ? { ...microgrid, instances: microgrid.instances.map((i) => (fid[i.key] != null ? { ...i, fidelity: fid[i.key] as 0 | 1 | 2 } : i)) }
      : microgrid;
  const e = new Engine(microgrid.timestepSeconds, 0, microgrid.seed);
  e.build(scn, microgridRegistry);
  return e;
}

// ---------- graph node ----------
interface NodeData extends Record<string, unknown> {
  label: string;
  type: string;
  health: string;
  bus?: string;
  sel?: boolean;
  fig?: readonly [string, number, string];
}
function FlowNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className={`node ${d.health}${d.bus ? ' bus' : ''}${d.sel ? ' sel' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-name">{d.label}</div>
      <div className="node-type">{d.bus ? `${d.bus} bus` : d.type}</div>
      {d.fig && (
        <div className="node-fig tnum">
          {d.fig[0]}: <b>{fmt(d.fig[1])}</b> {d.fig[2]}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { flow: FlowNode };
const figOf = (v?: InstanceView) => v?.keyFigures[0];

export function App({
  theme,
  setTheme,
  onBack,
}: {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onBack?: () => void;
}) {
  const fidRef = useRef<Record<string, number>>({});
  const engineRef = useRef<Engine>();
  if (!engineRef.current) engineRef.current = buildEngine(fidRef.current);
  const [view, setView] = useState<'sim' | 'components' | 'sensitivity'>('sim');
  const [speedIdx, setSpeedIdx] = useState(1);
  const [sps, setSps] = useState(0); // measured steps/sec (throughput readout)
  const [selected, setSelected] = useState<string | null>(null);
  const [traceIds, setTraceIds] = useState<string[]>(['bus.power.offered', 'bus.power.served', 'bus.power.unmet']);
  const [, setRender] = useState(0);
  const [ver, setVer] = useState(0);

  const speedRef = useRef(SPEEDS[speedIdx].sps);
  useEffect(() => {
    speedRef.current = SPEEDS[speedIdx].sps;
  }, [speedIdx]);

  const struct = useMemo(() => engineRef.current!.structure(), []);
  const positions = useMemo(() => layeredLayout(struct.nodes, struct.edges), [struct]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(
    struct.nodes.map((n) => ({
      id: n.key,
      type: 'flow',
      position: positions.get(n.key) ?? { x: 0, y: 0 },
      data: { label: n.key, type: n.type, health: n.health, bus: n.providesBus },
    })),
  );
  const [edges, setEdges] = useEdgesState<Edge>(
    struct.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: { net: e.net, kind: e.kind },
      animated: e.kind === 'bus',
      label: e.kind === 'signal' && e.unit ? e.unit : undefined,
      style: { stroke: e.kind === 'bus' ? 'var(--bus)' : 'var(--accent)', strokeWidth: 1.6, strokeDasharray: e.kind === 'bus' ? '5 4' : undefined },
      labelStyle: { fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--mono)' },
      labelBgStyle: { fill: 'var(--bg-elev)', fillOpacity: 0.9 },
      markerEnd: { type: MarkerType.ArrowClosed, color: e.kind === 'bus' ? 'var(--bus)' : 'var(--accent)' },
    })),
  );

  // Stepping loop (requestAnimationFrame): step to hit the target rate, and
  // measure the ACHIEVED steps/sec so it's obvious the pace is a choice, not a
  // limit. "Max" is time-budgeted per frame to show the true ceiling.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let cnt = 0;
    let winStart = last;
    const loop = (now: number) => {
      const dtR = Math.min(0.1, (now - last) / 1000);
      last = now;
      const target = speedRef.current;
      const eng = engineRef.current!;
      if (target === Infinity) {
        const end = performance.now() + 9;
        let n = 0;
        while (performance.now() < end) {
          eng.step();
          if (++n >= 500000) break;
        }
        cnt += n;
      } else if (target > 0) {
        acc += target * dtR;
        let n = Math.min(200000, Math.floor(acc));
        acc -= n;
        cnt += n;
        while (n-- > 0) eng.step();
      }
      if (now - winStart >= 400) {
        setSps(target === 0 ? 0 : Math.round(cnt / ((now - winStart) / 1000)));
        cnt = 0;
        winStart = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Render throttle (~15 Hz): refresh node figures + trigger a re-render for the
  // assets / inspector / scope. Decoupled from stepping so motion stays smooth.
  useEffect(() => {
    const id = setInterval(() => {
      const eng = engineRef.current!;
      const views = eng.instanceViews();
      const figs = new Map(views.map((v) => [v.key, figOf(v)] as const));
      const healths = new Map(views.map((v) => [v.key, v.health] as const));
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, fig: figs.get(n.id), health: healths.get(n.id) ?? n.data.health } })));
      setRender((r) => r + 1);
    }, 66);
    return () => clearInterval(id);
  }, [setNodes]);

  // selection highlight on nodes
  useEffect(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, sel: n.id === selected } })));
  }, [selected, setNodes]);

  // colour + thicken edges that are currently being scoped
  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => {
        const net = (e.data as { net?: string })?.net;
        const kind = (e.data as { kind?: string })?.kind;
        const idx = net ? traceIds.indexOf(net) : -1;
        const plotted = idx >= 0;
        const base = kind === 'bus' ? 'var(--bus)' : 'var(--accent)';
        return {
          ...e,
          animated: plotted || kind === 'bus',
          style: { ...e.style, stroke: plotted ? PALETTE[idx % PALETTE.length] : base, strokeWidth: plotted ? 3 : 1.6 },
        };
      }),
    );
  }, [traceIds, setEdges]);

  const engine = engineRef.current;
  const views = engine.instanceViews();
  const day = Math.floor(engine.t / 86400);
  const hour = Math.floor((engine.t % 86400) / 3600);
  const specs = useMemo(() => catalog(microgridRegistry), [ver]);
  const defByType = useMemo(() => {
    const m = new Map<string, ModelDef>();
    for (const t of microgridRegistry.types()) m.set(t, microgridRegistry.get(t)!);
    return m;
  }, []);

  const toggleTrace = (net?: string) => {
    if (!net) return;
    setTraceIds((ids) => (ids.includes(net) ? ids.filter((x) => x !== net) : [...ids, net]));
  };

  const rebuild = () => {
    engineRef.current = buildEngine(fidRef.current);
    setVer((v) => v + 1);
    setRender((r) => r + 1);
  };
  const setFidelity = (key: string, level: number) => {
    // Rebuild with the new fidelity but fast-forward to the SAME moment, so the
    // output change is visible immediately (not reset to midnight).
    const prevStep = Math.min(engineRef.current!.stepIndex, 200000);
    fidRef.current = { ...fidRef.current, [key]: level };
    const e = buildEngine(fidRef.current);
    e.run(prevStep);
    engineRef.current = e;
    setVer((v) => v + 1);
    setRender((r) => r + 1);
  };

  const traces: Trace[] = traceIds.map((id, i) => {
    const s = engine.history.series(id);
    return { id, label: s?.name ?? id, unit: s?.unit ?? '', color: PALETTE[i % PALETTE.length], values: s?.tail(WINDOW) ?? [] };
  });
  const scopeLen = traces.reduce((m, t) => Math.max(m, t.values.length), 0);
  const scopeStart = Math.max(0, engine.stepIndex - scopeLen);

  return (
    <div className="app">
      <header className="top">
        <button className="brand" onClick={onBack} style={{ background: 'none', border: 0, padding: 0 }}>
          <svg className="glyph" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0l8 8-8 8-8-8z" />
          </svg>
          ModelFlow
          {onBack && <span className="back-hint">← overview</span>}
        </button>
        <span className="chip">{microgrid.name}</span>
        <span className="chip" title="How much simulated time one step advances">
          Δt = {STEP_H} h / step
        </span>
        <span className="readout tnum">
          day {day} · {String(hour).padStart(2, '0')}:00 · step {engine.stepIndex.toLocaleString()}
        </span>
        <div className="grow" />
        {view === 'sim' && (
          <>
            <div className="seg speed" role="group" title="Playback speed (steps of simulated time per real second)">
              {SPEEDS.map((s, i) => (
                <button key={s.label} aria-selected={speedIdx === i} onClick={() => setSpeedIdx(i)}>
                  {s.label}
                </button>
              ))}
            </div>
            <span className="throughput tnum" title="Simulation steps computed per real second — the pace is a choice, not a limit">
              {fmtInt(sps)} steps/s
            </span>
          </>
        )}
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={view === 'sim'} onClick={() => setView('sim')}>
            Simulation
          </button>
          <button role="tab" aria-selected={view === 'components'} onClick={() => setView('components')}>
            Components
          </button>
          <button role="tab" aria-selected={view === 'sensitivity'} onClick={() => setView('sensitivity')}>
            Sensitivity
          </button>
        </div>
        <button className="pill secondary" onClick={rebuild}>
          Reset
        </button>
        <button className="iconbtn" title="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </header>

      {view === 'sim' ? (
        <div className="workspace">
          <aside className="assets">
            <div className="panel-h">Models · {views.length}</div>
            {views.map((v) => (
              <button className={`asset${selected === v.key ? ' sel' : ''}`} key={v.key} onClick={() => setSelected(v.key)}>
                <div className="a-l">
                  <div className="a-name">
                    <span className={`dot ${v.health}`} />
                    {v.key}
                  </div>
                  <div className="a-type">{v.type}</div>
                </div>
                <div className="a-figs">
                  {v.keyFigures.map(([l, val, u]) => (
                    <span className="a-fig tnum" key={l}>
                      {l} <b>{fmt(val)}</b>
                      {u ? ` ${u}` : ''}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </aside>

          <div className="canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={(_, n) => setSelected(n.id)}
              onEdgeClick={(_, e) => toggleTrace((e.data as { net?: string })?.net)}
              onPaneClick={() => setSelected(null)}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.4}
              maxZoom={1.6}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="var(--border)" gap={24} />
              <Controls showInteractive={false} />
            </ReactFlow>
            <div className="legend">
              <div className="row">
                <span className="sw sig" /> Signal — click an edge to scope it
              </div>
              <div className="row">
                <span className="sw bus" /> Power bus — shared supply, split by priority
              </div>
            </div>
          </div>

          <aside className="inspector">
            {selected ? (
              <AssetInspector
                key={selected}
                keyName={selected}
                engine={engine}
                view={views.find((v) => v.key === selected)}
                def={defByType.get(views.find((v) => v.key === selected)?.type ?? '')}
                traceIds={traceIds}
                onToggle={toggleTrace}
                onClose={() => setSelected(null)}
                onViewLogic={() => setView('components')}
                onSetFidelity={setFidelity}
              />
            ) : (
              <SignalPicker engine={engine} traceIds={traceIds} onToggle={toggleTrace} />
            )}
          </aside>

          <div className="scope-wrap">
            <Scope traces={traces} startStep={scopeStart} dt={microgrid.timestepSeconds} onRemove={(id) => toggleTrace(id)} />
          </div>
        </div>
      ) : view === 'sensitivity' ? (
        <SensitivityView />
      ) : (
        <div className="components">
          <div className="components-inner">
            <p className="components-lead">
              {specs.length} reusable models. Every interface point declares its unit and physical dimension, so any of these
              drops into another simulation. The logic is plain TypeScript — read it, or edit it and re-run.
            </p>
            <div className="cards">
              {specs.map((s) => (
                <ComponentCard key={s.type} spec={s} def={defByType.get(s.type)} onApply={rebuild} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- asset inspector ----------
function AssetInspector({
  keyName,
  engine,
  view,
  def,
  traceIds,
  onToggle,
  onClose,
  onViewLogic,
  onSetFidelity,
}: {
  keyName: string;
  engine: Engine;
  view?: InstanceView;
  def?: ModelDef;
  traceIds: string[];
  onToggle: (net: string) => void;
  onClose: () => void;
  onViewLogic: () => void;
  onSetFidelity: (key: string, level: number) => void;
}) {
  const maxFid = def?.maxFidelity ?? 1;
  const inst = microgrid.instances.find((i) => i.key === keyName);
  const spec = def ? modelSpec(def) : null;
  const ports = Object.entries(def?.ports ?? {}).map(([name, pd]) => {
    const net = inst?.connect?.[name] ?? `${keyName}.${name}`;
    return { name, dir: pd.dir, unit: pd.unit, net, value: engine.netValue(net) };
  });

  return (
    <div className="insp">
      <div className="insp-head">
        <div>
          <div className="insp-name">{keyName}</div>
          <div className="insp-type mono">{view?.type}</div>
        </div>
        <button className="iconbtn sm" onClick={onClose} title="Close">
          ×
        </button>
      </div>
      {spec?.description && <div className="insp-desc">{spec.description}</div>}

      <div className="insp-meta">
        <span className={`badge ${view?.health}`}>{view?.health ?? 'nominal'}</span>
        <span className="badge muted">{view?.status ?? 'nominal'}</span>
      </div>

      {maxFid > 0 && (
        <>
          <div className="insp-h">Level of detail{maxFid <= 1 ? ' (single)' : ''}</div>
          <div className="fid-seg">
            {Array.from({ length: maxFid + 1 }, (_, l) => (
              <button
                key={l}
                aria-selected={(view?.fidelity ?? 1) === l}
                disabled={maxFid <= 1}
                onClick={() => onSetFidelity(keyName, l)}
                title={`L${l}`}
              >
                L{l}
              </button>
            ))}
          </div>
        </>
      )}

      {view && view.keyFigures.length > 0 && (
        <>
          <div className="insp-h">State</div>
          {view.keyFigures.map(([l, val, u]) => (
            <div className="kv" key={l}>
              <span>{l}</span>
              <b className="tnum">
                {fmt(val)}
                {u ? ` ${u}` : ''}
              </b>
            </div>
          ))}
        </>
      )}

      {ports.length > 0 && (
        <>
          <div className="insp-h">Ports — click to probe</div>
          {ports.map((p) => {
            const plotted = traceIds.includes(p.net);
            return (
              <button className={`port-row${plotted ? ' on' : ''}`} key={p.name} onClick={() => onToggle(p.net)}>
                <span className={`dir ${p.dir}`}>{p.dir === 'in' ? '→' : '←'}</span>
                <span className="pn mono">{p.name}</span>
                <span className="pv tnum mono">
                  {fmt(p.value)}
                  {p.unit ? ` ${p.unit}` : ''}
                </span>
                <span className="probe">{plotted ? '● scoping' : '○ scope'}</span>
              </button>
            );
          })}
        </>
      )}

      {spec && spec.params.length > 0 && (
        <>
          <div className="insp-h">Parameters</div>
          {spec.params.map((p) => {
            const url = p.sourceUrl ?? p.sources?.find((s) => s.url)?.url;
            const cite = p.source ?? p.sources?.find((s) => s.citation)?.citation;
            return (
              <div className="kv col" key={p.name}>
                <div className="kv">
                  <span className="mono">{p.name}</span>
                  <b className="tnum">
                    {fmt(p.value)} {p.unit}
                  </b>
                </div>
                {p.notes && <div className="pnote">{p.notes}</div>}
                {(url || cite) &&
                  (url ? (
                    <a className="src-link" href={url} target="_blank" rel="noreferrer">
                      {cite ?? 'source'} ↗
                    </a>
                  ) : (
                    <span className="src-cite">{cite}</span>
                  ))}
              </div>
            );
          })}
        </>
      )}

      {def?.step && (
        <button className="insp-logic" onClick={onViewLogic}>
          View &amp; edit logic in Components →
        </button>
      )}
    </div>
  );
}

// ---------- signal picker (shown when nothing is selected) ----------
function SignalPicker({ engine, traceIds, onToggle }: { engine: Engine; traceIds: string[]; onToggle: (net: string) => void }) {
  const [q, setQ] = useState('');
  const series = engine.history.all
    .filter((s) => s.id.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.id.localeCompare(b.id));
  return (
    <div className="insp">
      <div className="insp-head">
        <div className="insp-name">Signals</div>
      </div>
      <div className="insp-desc">Every net is a probe point. Toggle any to plot it on the scope — or click an asset / edge in the graph.</div>
      <input className="sig-search" placeholder="filter signals…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="sig-list">
        {series.map((s) => {
          const on = traceIds.includes(s.id);
          return (
            <button key={s.id} className={`sig-row${on ? ' on' : ''}`} onClick={() => onToggle(s.id)}>
              <span className="sig-dot" />
              <span className="sig-name mono">{s.id}</span>
              <span className="sig-val tnum mono">
                {fmt(s.latest)}
                {s.unit ? ` ${s.unit}` : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- sensitivity (parameter tornado) ----------
const METRICS = [
  { id: 'bus.power.served', label: 'Total power delivered (Σ served)' },
  { id: 'bus.power.unmet', label: 'Total unmet demand (Σ unmet)' },
  { id: 'bus.power.offered', label: 'Total power available (Σ offered)' },
];
const DELTAS = [0.1, 0.2, 0.5];

function SensitivityView() {
  const [metric, setMetric] = useState(METRICS[0].id);
  const [delta, setDelta] = useState(0.2);
  const [result, setResult] = useState<SensiResult | null>(null);
  const [busy, setBusy] = useState(false);
  const days = Math.round(microgrid.durationSeconds / 86400);

  const run = () => {
    setBusy(true);
    setTimeout(() => {
      try {
        setResult(sensitivity(microgrid, microgridRegistry, { seriesId: metric, mode: 'sum', deltaPct: delta }));
      } catch (e) {
        console.error(e);
      } finally {
        setBusy(false);
      }
    }, 20);
  };

  return (
    <div className="components">
      <div className="components-inner">
        <p className="components-lead">
          Fuzz every parameter one at a time by ±X% and rank which ones move the output the most — a sensitivity
          tornado. (This is distinct from a Monte-Carlo sweep, which varies many parameters together to get a
          distribution of outcomes.)
        </p>
        <div className="sensi-controls">
          <label className="sensi-field">
            <span>Output metric</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              {METRICS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <div className="sensi-field">
            <span>Perturbation</span>
            <div className="seg">
              {DELTAS.map((d) => (
                <button key={d} aria-selected={delta === d} onClick={() => setDelta(d)}>
                  ±{Math.round(d * 100)}%
                </button>
              ))}
            </div>
          </div>
          <button className="pill" onClick={run} disabled={busy}>
            {busy ? 'Running…' : 'Run sensitivity'}
          </button>
          {result && (
            <span className="sensi-n mono">
              {result.rows.length} params · summed over the {days}-day run
            </span>
          )}
        </div>
        {result ? (
          <Tornado result={result} />
        ) : (
          <div className="sensi-empty">
            Pick an output and run. Each bar shows how far the metric swings when that one parameter is nudged
            ±{Math.round(delta * 100)}% — longest bars at the top are the parameters that matter most.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- component catalog card ----------
function compileStep(src: string): (ctx: unknown) => void {
  const s = src.trim();
  const lp = s.indexOf('(');
  const rp = s.indexOf(')', lp);
  const lb = s.indexOf('{');
  const rb = s.lastIndexOf('}');
  if (lp < 0 || rp < 0 || lb < 0 || rb < 0 || rb < lb) throw new Error('Could not parse a function');
  const params = s.slice(lp + 1, rp).trim() || 'ctx';
  const body = s.slice(lb + 1, rb);
  // eslint-disable-next-line no-new-func
  return new Function(params, body) as (ctx: unknown) => void;
}

function ComponentCard({ spec, def, onApply }: { spec: ModelSpec; def?: ModelDef; onApply: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(spec.source.step ?? '');
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);
  useEffect(() => {
    setText(spec.source.step ?? '');
    setNote(null);
  }, [spec.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = () => {
    try {
      const fn = compileStep(text);
      if (def) (def as { step: unknown }).step = fn;
      setNote({ ok: true, msg: 'Applied — simulation restarted with the new logic.' });
      setEditing(false);
      onApply();
    } catch (e) {
      setNote({ ok: false, msg: `Couldn't apply: ${(e as Error).message}` });
    }
  };

  return (
    <div className="card">
      <div className="card-top">
        <div className="card-name">{spec.type}</div>
        {spec.description && <div className="card-desc">{spec.description}</div>}
      </div>
      <div className="card-body">
        {spec.ports.length > 0 && <div className="io-h">Ports</div>}
        {spec.ports.map((p) => (
          <div className="io" key={p.name}>
            <span className={`dir ${p.dir}`}>{p.dir === 'in' ? '→' : '←'}</span>
            <span className="nm">{p.name}</span>
            <span className="un">{p.unit || '—'}</span>
            <span className="dm">{p.dimension}</span>
          </div>
        ))}
        {spec.params.length > 0 && <div className="io-h">Parameters</div>}
        {spec.params.map((p) => {
          const links = [
            ...(p.sourceUrl || p.source ? [{ url: p.sourceUrl, label: p.source ?? 'source' }] : []),
            ...(p.sources ?? []).map((s) => ({ url: s.url, label: s.citation ?? 'source' })),
          ];
          return (
            <div key={p.name}>
              <div className="io p">
                <span className="nm">{p.name}</span>
                <span className="un">
                  {fmt(p.value)} {p.unit}
                </span>
                <span className="dm">{p.dimension}</span>
              </div>
              {(p.notes || links.length > 0) && (
                <div className="io-meta">
                  {p.notes && <span className="note">{p.notes}</span>}
                  {links.map((l, i) =>
                    l.url ? (
                      <a key={i} className="src-link" href={l.url} target="_blank" rel="noreferrer">
                        {l.label} ↗
                      </a>
                    ) : (
                      <span key={i} className="src-cite">
                        {l.label}
                      </span>
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
        {spec.providesBus && <div className="card-bus">provides the “{spec.providesBus}” bus</div>}
      </div>
      {spec.source.step && (
        <div className="code">
          <div className="code-bar">
            <span>TypeScript · step(ctx)</span>
            <div className="acts">
              {editing ? (
                <>
                  <button className="code-btn" onClick={() => { setEditing(false); setText(spec.source.step ?? ''); }}>
                    Cancel
                  </button>
                  <button className="code-btn primary" onClick={apply}>
                    Apply &amp; run
                  </button>
                </>
              ) : (
                <button className="code-btn" onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
            </div>
          </div>
          {editing ? (
            <textarea className="src" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
          ) : (
            <pre className="src">{spec.source.step}</pre>
          )}
          {note && <div className={`apply-note ${note.ok ? 'ok' : 'err'}`}>{note.msg}</div>}
        </div>
      )}
    </div>
  );
}
