import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Engine, catalog, type InstanceView } from '@modelflow/core';
import { microgrid, microgridRegistry } from './demo';
import { layeredLayout } from './layout';
import { Chart } from './Chart';
import './theme.css';

const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });

const CHARTS = [
  { id: 'sun', title: 'Irradiance', unit: 'W/m²', color: '#f5c542' },
  { id: 'bus.power.offered', title: 'Bus offered', unit: 'kW', color: '#4ade80' },
  { id: 'bus.power.served', title: 'Bus served', unit: 'kW', color: '#54c7e8' },
  { id: 'bus.power.unmet', title: 'Unmet (shed)', unit: 'kW', color: '#f87171' },
  { id: 'sv_isru', title: 'ISRU served', unit: 'kW', color: '#a78bfa' },
];

interface NodeData extends Record<string, unknown> {
  label: string;
  type: string;
  health: string;
  fig?: readonly [string, number, string];
  bus?: string;
}

function MFNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className={`mf-node ${d.health}${d.bus ? ' is-bus' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="mf-key">{d.label}</div>
      <div className="mf-type">{d.bus ? `⤳ ${d.bus} bus` : d.type}</div>
      {d.fig && (
        <div className="mf-fig">
          {d.fig[0]}: <b>{fmt(d.fig[1])}</b> {d.fig[2]}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { mf: MFNode };

export function App() {
  const [resetKey, setResetKey] = useState(0);
  const engine = useMemo(() => {
    const e = new Engine(microgrid.timestepSeconds, 0, microgrid.seed);
    e.build(microgrid, microgridRegistry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return e;
  }, [resetKey]);

  const [running, setRunning] = useState(true);
  const [tab, setTab] = useState<'inspect' | 'catalog'>('inspect');
  const [, setTick] = useState(0);
  const lastRender = useRef(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (running) for (let i = 0; i < 2; i++) engine.step();
      const now = performance.now();
      if (now - lastRender.current > 80) {
        lastRender.current = now;
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, engine]);

  const struct = useMemo(() => engine.structure(), [engine]);
  const positions = useMemo(() => layeredLayout(struct.nodes, struct.edges), [struct]);
  const views = engine.instanceViews();
  const viewByKey = new Map<string, InstanceView>(views.map((v) => [v.key, v]));

  const rfNodes: Node[] = struct.nodes.map((n) => ({
    id: n.key,
    type: 'mf',
    position: positions.get(n.key) ?? { x: 0, y: 0 },
    data: {
      label: n.key,
      type: n.type,
      health: n.health,
      bus: n.providesBus,
      fig: viewByKey.get(n.key)?.keyFigures[0],
    } satisfies NodeData,
  }));

  const rfEdges: Edge[] = struct.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: e.kind === 'bus',
    label: e.kind === 'signal' && e.unit ? e.unit : undefined,
    style: { stroke: e.kind === 'bus' ? '#f5a623' : '#4a90d9', strokeWidth: 1.6 },
    labelStyle: { fill: '#9aa4b2', fontSize: 9, fontFamily: 'ui-monospace, monospace' },
    labelBgStyle: { fill: '#0d1017', fillOpacity: 0.85 },
    markerEnd: { type: MarkerType.ArrowClosed, color: e.kind === 'bus' ? '#f5a623' : '#4a90d9' },
  }));

  const day = Math.floor(engine.t / 86400);
  const hour = Math.floor((engine.t % 86400) / 3600);
  const specs = useMemo(() => catalog(microgridRegistry), []);

  return (
    <div className="studio">
      <header className="topbar">
        <div className="brand">
          <span className="logo">◆</span> ModelFlow <span className="brand-sub">Studio</span>
        </div>
        <div className="scenario">{microgrid.name}</div>
        <div className="clock">
          day {day} · {String(hour).padStart(2, '0')}:00 · step {engine.stepIndex}
        </div>
        <div className="spacer" />
        <div className="tabs">
          <button className={tab === 'inspect' ? 'on' : ''} onClick={() => setTab('inspect')}>
            Inspect
          </button>
          <button className={tab === 'catalog' ? 'on' : ''} onClick={() => setTab('catalog')}>
            Catalog
          </button>
        </div>
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? '❚❚ Pause' : '▶ Play'}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setResetKey((k) => k + 1);
            lastRender.current = 0;
          }}
        >
          ↺ Reset
        </button>
      </header>

      {tab === 'inspect' ? (
        <div className="grid">
          <aside className="assets">
            <div className="panel-title">Assets · {views.length}</div>
            <table>
              <tbody>
                {views.map((v) => (
                  <tr key={v.key}>
                    <td>
                      <span className={`dot ${v.health}`} />
                      <span className="a-key">{v.key}</span>
                      <span className="a-type">{v.type}</span>
                    </td>
                    <td className="a-figs">
                      {v.keyFigures.map(([l, val, u]) => (
                        <span key={l} className="fig">
                          {l} <b>{fmt(val)}</b>
                          {u ? ` ${u}` : ''}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </aside>

          <main className="graph">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.3}
              maxZoom={1.8}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
            >
              <Background color="rgba(255,255,255,0.05)" gap={22} />
              <Controls showInteractive={false} />
            </ReactFlow>
            <div className="legend">
              <span>
                <i className="sw sig" /> signal (port→port, unit-labelled)
              </span>
              <span>
                <i className="sw bus" /> power bus (arbitrated)
              </span>
            </div>
          </main>

          <section className="charts">
            <div className="panel-title">Signals over time</div>
            {CHARTS.map((c) => (
              <Chart
                key={c.id}
                title={c.title}
                unit={c.unit}
                color={c.color}
                values={engine.history.series(c.id)?.toArray().slice(-140) ?? []}
              />
            ))}
          </section>
        </div>
      ) : (
        <div className="catalog">
          <div className="panel-title">Component catalog — {specs.length} models · units crystal-clear, ready to publish</div>
          <div className="cat-grid">
            {specs.map((s) => (
              <div key={s.type} className="cat-card">
                <div className="cat-type">{s.type}</div>
                {s.description && <div className="cat-desc">{s.description}</div>}
                <div className="cat-sec">Ports</div>
                {s.ports.map((p) => (
                  <div key={p.name} className="cat-row">
                    <span className={`arrow ${p.dir}`}>{p.dir === 'in' ? '→' : '←'}</span>
                    <span className="cat-name">{p.name}</span>
                    <span className="cat-unit">{p.unit || '—'}</span>
                    <span className="cat-dim">{p.dimension}</span>
                  </div>
                ))}
                {s.params.length > 0 && <div className="cat-sec">Params</div>}
                {s.params.map((p) => (
                  <div key={p.name} className="cat-row">
                    <span className="cat-name">{p.name}</span>
                    <span className="cat-unit">{fmt(p.value)} {p.unit}</span>
                    <span className="cat-dim">{p.dimension}</span>
                  </div>
                ))}
                {s.providesBus && <div className="cat-bus">provides «{s.providesBus}» bus</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
