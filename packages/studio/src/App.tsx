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
import { publishModel } from './library';
import {
  evalAlert,
  loadTemplates,
  storeTemplates,
  loadParamSets,
  storeParamSets,
  uid,
  type Alert,
  type AlertOp,
  type ViewTemplate,
  type ParamSet,
} from './workspace';
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

function buildEngine(fid: Record<string, number> = {}, paramOv: Record<string, Record<string, number>> = {}): Engine {
  const dirty = Object.keys(fid).length > 0 || Object.keys(paramOv).length > 0;
  const scn = dirty
    ? {
        ...microgrid,
        instances: microgrid.instances.map((i) => {
          const patch: { fidelity?: 0 | 1 | 2; params?: Record<string, number> } = {};
          if (fid[i.key] != null) patch.fidelity = fid[i.key] as 0 | 1 | 2;
          if (paramOv[i.key]) patch.params = { ...(i.params ?? {}), ...paramOv[i.key] };
          return Object.keys(patch).length ? { ...i, ...patch } : i;
        }),
      }
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
  const paramOvRef = useRef<Record<string, Record<string, number>>>({});
  const engineRef = useRef<Engine>();
  if (!engineRef.current) engineRef.current = buildEngine(fidRef.current, paramOvRef.current);
  const [view, setView] = useState<'sim' | 'components' | 'sensitivity' | 'scenario'>('sim');
  const [speedIdx, setSpeedIdx] = useState(1);
  const [sps, setSps] = useState(0); // measured steps/sec (throughput readout)
  const [selected, setSelected] = useState<string | null>(null);
  const [traceIds, setTraceIds] = useState<string[]>(['bus.power.offered', 'bus.power.served', 'bus.power.unmet']);
  const [showModels, setShowModels] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([{ id: uid(), seriesId: 'bus.power.unmet', op: '>', threshold: 5 }]);
  const [popover, setPopover] = useState<null | 'alerts' | 'save'>(null);
  const [templates, setTemplates] = useState<ViewTemplate[]>(() => loadTemplates());
  const [paramSets, setParamSets] = useState<ParamSet[]>(() => loadParamSets());
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
    engineRef.current = buildEngine(fidRef.current, paramOvRef.current);
    setVer((v) => v + 1);
    setRender((r) => r + 1);
  };
  // Rebuild but fast-forward to the SAME moment, so a fidelity/param change shows
  // its impact immediately instead of resetting to midnight.
  const rebuildInPlace = () => {
    const prevStep = Math.min(engineRef.current!.stepIndex, 200000);
    const e = buildEngine(fidRef.current, paramOvRef.current);
    e.run(prevStep);
    engineRef.current = e;
    setVer((v) => v + 1);
    setRender((r) => r + 1);
  };
  const setFidelity = (key: string, level: number) => {
    fidRef.current = { ...fidRef.current, [key]: level };
    rebuildInPlace();
  };
  const setParam = (key: string, param: string, value: number) => {
    if (!Number.isFinite(value)) return;
    paramOvRef.current = { ...paramOvRef.current, [key]: { ...(paramOvRef.current[key] ?? {}), [param]: value } };
    rebuildInPlace();
  };

  // alerts evaluated live against the current signal values
  const triggered = alerts
    .map((a) => {
      const s = engineRef.current!.history.series(a.seriesId);
      const value = s ? s.latest : engineRef.current!.netValue(a.seriesId);
      return { alert: a, value, on: evalAlert(a.op, value, a.threshold) };
    })
    .filter((t) => t.on);

  const saveTemplate = (name: string) => {
    const next = [...templates.filter((x) => x.name !== name), { name, traceIds, alerts, showModels, fidelity: { ...fidRef.current } }];
    setTemplates(next);
    storeTemplates(next);
  };
  const loadTemplate = (t: ViewTemplate) => {
    setTraceIds(t.traceIds);
    setAlerts(t.alerts);
    setShowModels(t.showModels);
    fidRef.current = t.fidelity ?? {};
    rebuild();
    setPopover(null);
  };
  const deleteTemplate = (name: string) => {
    const next = templates.filter((x) => x.name !== name);
    setTemplates(next);
    storeTemplates(next);
  };
  const saveParamSet = (name: string) => {
    const next = [...paramSets.filter((x) => x.name !== name), { name, overrides: JSON.parse(JSON.stringify(paramOvRef.current)) }];
    setParamSets(next);
    storeParamSets(next);
  };
  const loadParamSet = (p: ParamSet) => {
    paramOvRef.current = JSON.parse(JSON.stringify(p.overrides));
    rebuild();
    setPopover(null);
  };
  const deleteParamSet = (name: string) => {
    const next = paramSets.filter((x) => x.name !== name);
    setParamSets(next);
    storeParamSets(next);
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
        <div className="grow" />
        <div className="seg" role="tablist">
          {(['sim', 'components', 'sensitivity', 'scenario'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
              {v === 'sim' ? 'Simulation' : v === 'components' ? 'Components' : v === 'sensitivity' ? 'Sensitivity' : 'Scenario'}
            </button>
          ))}
        </div>
        <button className="iconbtn" title="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </header>

      {view === 'sim' && (
        <div className="subbar">
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
          <span className="sub-sep" />
          <span className="subclock tnum">
            day {day} · {String(hour).padStart(2, '0')}:00 · step {engine.stepIndex.toLocaleString()}
          </span>
          <span className="sub-dt" title="How much simulated time one step advances">
            1 step = {STEP_H} h
          </span>
          <div className="grow" />
          <button className="tbtn hide-models-btn" onClick={() => setShowModels((s) => !s)}>
            {showModels ? 'Hide models' : 'Show models'}
          </button>
          <div className="pop-anchor">
            <button className={`tbtn${triggered.length ? ' alarm' : ''}`} onClick={() => setPopover((p) => (p === 'alerts' ? null : 'alerts'))}>
              ⚠ Alerts{alerts.length ? ` (${alerts.length})` : ''}
            </button>
            {popover === 'alerts' && (
              <AlertsPopover engine={engine} alerts={alerts} setAlerts={setAlerts} onClose={() => setPopover(null)} />
            )}
          </div>
          <div className="pop-anchor">
            <button className="tbtn" onClick={() => setPopover((p) => (p === 'save' ? null : 'save'))}>
              Save / Load
            </button>
            {popover === 'save' && (
              <SaveLoadPopover
                templates={templates}
                paramSets={paramSets}
                hasParamOverrides={Object.keys(paramOvRef.current).length > 0}
                onSaveTemplate={saveTemplate}
                onLoadTemplate={loadTemplate}
                onDeleteTemplate={deleteTemplate}
                onSaveParamSet={saveParamSet}
                onLoadParamSet={loadParamSet}
                onDeleteParamSet={deleteParamSet}
              />
            )}
          </div>
          <button className="tbtn" onClick={rebuild}>
            Reset
          </button>
        </div>
      )}

      {view === 'sim' && triggered.length > 0 && (
        <div className="alert-banner">
          <span className="ab-icon">⚠</span>
          {triggered.map((t) => (
            <span className="ab-item mono" key={t.alert.id}>
              {t.alert.seriesId} {t.alert.op} {t.alert.threshold} · now {fmt(t.value)}
            </span>
          ))}
        </div>
      )}

      {view === 'sim' ? (
        <div className={`workspace${showModels ? '' : ' no-models'}`}>
          {showModels && (
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
          )}

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
                onSetParam={setParam}
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
      ) : view === 'scenario' ? (
        <ScenarioView />
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
  onSetParam,
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
  onSetParam: (key: string, param: string, value: number) => void;
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
          <div className="insp-h">Parameters — editable</div>
          {spec.params.map((p) => {
            const url = p.sourceUrl ?? p.sources?.find((s) => s.url)?.url;
            const cite = p.source ?? p.sources?.find((s) => s.citation)?.citation;
            const cur = view?.params?.[p.name] ?? p.value;
            const overridden = Math.abs(cur - p.value) > 1e-12;
            return (
              <div className="kv col" key={p.name}>
                <div className="kv">
                  <span className="mono">
                    {p.name}
                    {overridden && <span className="ovr-dot" title={`default ${fmt(p.value)}`} />}
                  </span>
                  <span className="param-edit">
                    <ParamInput value={cur} onCommit={(n) => onSetParam(keyName, p.name, n)} />
                    {p.unit && <span className="punit mono">{p.unit}</span>}
                  </span>
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

// ---------- editable parameter input (commits on blur / Enter) ----------
function ParamInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const commit = () => {
    const n = parseFloat(v);
    if (Number.isFinite(n) && n !== value) onCommit(n);
    else setV(String(value));
  };
  return (
    <input
      className="pinput tnum"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setV(String(value));
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
    />
  );
}

// ---------- alerts popover ----------
function AlertsPopover({
  engine,
  alerts,
  setAlerts,
  onClose,
}: {
  engine: Engine;
  alerts: Alert[];
  setAlerts: (a: Alert[]) => void;
  onClose: () => void;
}) {
  const series = engine.history.all.map((s) => s.id).sort();
  const [sid, setSid] = useState(series.find((s) => s === 'bus.power.unmet') ?? series[0] ?? '');
  const [op, setOp] = useState<AlertOp>('>');
  const [thr, setThr] = useState('5');
  const add = () => {
    const t = parseFloat(thr);
    if (!sid || !Number.isFinite(t)) return;
    setAlerts([...alerts, { id: uid(), seriesId: sid, op, threshold: t }]);
  };
  return (
    <>
      <div className="pop-scrim" onClick={onClose} />
      <div className="popover">
        <div className="pop-h">Alert conditions</div>
        <div className="pop-body">
          {alerts.length === 0 && <div className="pop-empty">No alerts yet.</div>}
          {alerts.map((a) => (
            <div className="alert-row" key={a.id}>
              <span className="mono">
                {a.seriesId} {a.op} {a.threshold}
              </span>
              <button className="x" onClick={() => setAlerts(alerts.filter((x) => x.id !== a.id))} title="Remove">
                ×
              </button>
            </div>
          ))}
          <div className="alert-form">
            <select value={sid} onChange={(e) => setSid(e.target.value)}>
              {series.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={op} onChange={(e) => setOp(e.target.value as AlertOp)}>
              {(['>', '>=', '<', '<='] as AlertOp[]).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <input className="pinput tnum" value={thr} onChange={(e) => setThr(e.target.value)} />
            <button className="tbtn primary" onClick={add}>
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------- save / load popover ----------
function SaveLoadPopover({
  templates,
  paramSets,
  hasParamOverrides,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onSaveParamSet,
  onLoadParamSet,
  onDeleteParamSet,
}: {
  templates: ViewTemplate[];
  paramSets: ParamSet[];
  hasParamOverrides: boolean;
  onSaveTemplate: (n: string) => void;
  onLoadTemplate: (t: ViewTemplate) => void;
  onDeleteTemplate: (n: string) => void;
  onSaveParamSet: (n: string) => void;
  onLoadParamSet: (p: ParamSet) => void;
  onDeleteParamSet: (n: string) => void;
}) {
  const [tName, setTName] = useState('');
  const [pName, setPName] = useState('');
  return (
    <div className="popover wide">
      <div className="pop-h">Views — charts, scope, alerts &amp; layout</div>
      <div className="pop-body">
        <div className="save-form">
          <input className="pinput" placeholder="name this view" value={tName} onChange={(e) => setTName(e.target.value)} />
          <button className="tbtn primary" disabled={!tName.trim()} onClick={() => { onSaveTemplate(tName.trim()); setTName(''); }}>
            Save current
          </button>
        </div>
        {templates.length === 0 && <div className="pop-empty">No saved views.</div>}
        {templates.map((t) => (
          <div className="save-row" key={t.name}>
            <span className="sr-name">{t.name}</span>
            <span className="sr-meta">{t.traceIds.length} traces · {t.alerts.length} alerts</span>
            <button className="tbtn" onClick={() => onLoadTemplate(t)}>Load</button>
            <button className="x" onClick={() => onDeleteTemplate(t.name)}>×</button>
          </div>
        ))}
      </div>
      <div className="pop-h">Parameter sets</div>
      <div className="pop-body">
        <div className="save-form">
          <input className="pinput" placeholder="name this parameter set" value={pName} onChange={(e) => setPName(e.target.value)} />
          <button className="tbtn primary" disabled={!pName.trim() || !hasParamOverrides} onClick={() => { onSaveParamSet(pName.trim()); setPName(''); }}>
            Save current
          </button>
        </div>
        {!hasParamOverrides && paramSets.length === 0 && (
          <div className="pop-empty">Edit a model’s parameters in the inspector, then save the set here.</div>
        )}
        {paramSets.map((p) => (
          <div className="save-row" key={p.name}>
            <span className="sr-name">{p.name}</span>
            <span className="sr-meta">{Object.keys(p.overrides).length} models</span>
            <button className="tbtn" onClick={() => onLoadParamSet(p)}>Load</button>
            <button className="x" onClick={() => onDeleteParamSet(p.name)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- scenario JSON ----------
function ScenarioView() {
  const json = JSON.stringify(microgrid, null, 2);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="components">
      <div className="components-inner">
        <p className="components-lead">
          The entire solar-microgrid simulation is this one JSON spec — every model instance, its wiring, parameters, and
          load priorities. It’s pure data: hand it to any ModelFlow runtime and it runs identically.
        </p>
        <div className="scenario-bar">
          <span className="mono">solar-microgrid.json · {microgrid.instances.length} instances</span>
          <button className="tbtn" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy JSON'}
          </button>
        </div>
        <pre className="scenario-json">{json}</pre>
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
  const [published, setPublished] = useState(false);
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
                <>
                  <button
                    className="code-btn"
                    onClick={() => {
                      publishModel(spec);
                      setPublished(true);
                      setTimeout(() => setPublished(false), 1600);
                    }}
                  >
                    {published ? 'Published ✓' : 'Publish to Library'}
                  </button>
                  <button className="code-btn" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                </>
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
