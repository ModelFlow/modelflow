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
import { Engine, catalog, type ModelDef, type ModelSpec, type InstanceView } from '@modelflow/core';
import { microgrid, microgridRegistry } from './demo';
import { layeredLayout } from './layout';
import { Chart } from './Chart';
import './theme.css';

const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });

const CHARTS = [
  { id: 'sun', title: 'Solar irradiance', unit: 'W/m²', color: '#d97706' },
  { id: 'bus.power.offered', title: 'Power available', unit: 'kW', color: '#2563eb' },
  { id: 'bus.power.served', title: 'Power delivered', unit: 'kW', color: '#16a34a' },
  { id: 'bus.power.unmet', title: 'Unmet demand', unit: 'kW', color: '#dc2626' },
  { id: 'sv_isru', title: 'ISRU load', unit: 'kW', color: '#7c3aed' },
];

function buildEngine(): Engine {
  const e = new Engine(microgrid.timestepSeconds, 0, microgrid.seed);
  e.build(microgrid, microgridRegistry);
  return e;
}

// ---------- graph node ----------
interface NodeData extends Record<string, unknown> {
  label: string;
  type: string;
  health: string;
  bus?: string;
  fig?: readonly [string, number, string];
}
function FlowNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className={`node ${d.health}${d.bus ? ' bus' : ''}`}>
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

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const engineRef = useRef<Engine>();
  if (!engineRef.current) engineRef.current = buildEngine();
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'sim' | 'components'>('sim');
  const [, setRender] = useState(0);
  const [ver, setVer] = useState(0); // bumps when logic is edited/reset

  // static topology (identical across rebuilds — same scenario)
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
  const [edges] = useEdgesState<Edge>(
    struct.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.kind === 'bus',
      label: e.kind === 'signal' && e.unit ? e.unit : undefined,
      style: { stroke: e.kind === 'bus' ? 'var(--bus)' : 'var(--accent)', strokeWidth: 1.6, strokeDasharray: e.kind === 'bus' ? '5 4' : undefined },
      labelStyle: { fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--mono)' },
      labelBgStyle: { fill: 'var(--bg-elev)', fillOpacity: 0.9 },
      markerEnd: { type: MarkerType.ArrowClosed, color: e.kind === 'bus' ? 'var(--bus)' : 'var(--accent)' },
    })),
  );

  // One calm clock: step + refresh together at 4 Hz (≈3 s per simulated day),
  // so live numbers evolve smoothly and pausing is exact. No layout is touched.
  useEffect(() => {
    const id = setInterval(() => {
      if (running) {
        engineRef.current!.step();
        engineRef.current!.step();
      }
      const views = engineRef.current!.instanceViews();
      const figs = new Map(views.map((v) => [v.key, figOf(v)] as const));
      const healths = new Map(views.map((v) => [v.key, v.health] as const));
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, fig: figs.get(n.id), health: healths.get(n.id) ?? n.data.health } })),
      );
      setRender((r) => r + 1);
    }, 250);
    return () => clearInterval(id);
  }, [running, setNodes]);

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

  const rebuild = () => {
    engineRef.current = buildEngine();
    setVer((v) => v + 1);
    setRender((r) => r + 1);
  };

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <svg className="glyph" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0l8 8-8 8-8-8z" />
          </svg>
          ModelFlow
        </div>
        <span className="chip">{microgrid.name}</span>
        <span className="readout tnum">
          day {day} · {String(hour).padStart(2, '0')}:00 · step {engine.stepIndex}
        </span>
        <div className="grow" />
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={view === 'sim'} onClick={() => setView('sim')}>
            Simulation
          </button>
          <button role="tab" aria-selected={view === 'components'} onClick={() => setView('components')}>
            Components
          </button>
        </div>
        <button className="pill" onClick={() => setRunning((r) => !r)}>
          {running ? '❚❚ Pause' : '▶ Run'}
        </button>
        <button className="pill secondary" onClick={rebuild}>
          Reset
        </button>
        <button className="iconbtn" title="Toggle theme" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </header>

      {view === 'sim' ? (
        <div className="workspace">
          <aside className="assets">
            <div className="panel-h">Assets · {views.length}</div>
            {views.map((v) => (
              <div className="asset" key={v.key}>
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
              </div>
            ))}
          </aside>

          <div className="canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
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
                <span className="sw sig" /> Signal — one output → one input
              </div>
              <div className="row">
                <span className="sw bus" /> Power bus — shared supply, split by priority
              </div>
            </div>
          </div>

          <div className="charts">
            {CHARTS.map((c) => (
              <Chart key={c.id} title={c.title} unit={c.unit} color={c.color} values={engine.history.series(c.id)?.toArray().slice(-160) ?? []} />
            ))}
          </div>
        </div>
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
  // Reset the editor only when switching to a different model — not when this
  // model's own source updates after an Apply (which would wipe the confirmation).
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
        {spec.params.map((p) => (
          <div className="io p" key={p.name}>
            <span className="nm">{p.name}</span>
            <span className="un">
              {fmt(p.value)} {p.unit}
            </span>
            <span className="dm">{p.dimension}</span>
          </div>
        ))}
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
                    Apply & run
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
