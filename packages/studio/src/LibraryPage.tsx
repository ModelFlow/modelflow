import { useMemo, useState } from 'react';
import type { ModelSpec } from '@modelflow/core';
import { objects, searchObjects, type LibraryObject } from '@modelflow/std';
import { seedModels, loadPublished, unpublishModel } from './library';
import './theme.css';

const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 4 });
const valueText = (v: number | string, unit?: string) =>
  typeof v === 'number' ? `${fmt(v)}${unit ? ' ' + unit : ''}` : v;

type View = 'objects' | 'models';

export function Library({
  theme,
  setTheme,
  onBack,
  onDemo,
}: {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onBack: () => void;
  onDemo: () => void;
}) {
  const [view, setView] = useState<View>('objects');
  const [q, setQ] = useState('');
  const [pubVer, setPubVer] = useState(0);
  const published = useMemo(() => loadPublished(), [pubVer]);
  const seeds = useMemo(() => seedModels(), []);

  const pubTypes = new Set(published.map((m) => m.type));
  const allModels = [
    ...published.map((m) => ({ spec: m, published: true })),
    ...seeds.filter((m) => !pubTypes.has(m.type)).map((m) => ({ spec: m, published: false })),
  ];
  const ql = q.trim().toLowerCase();
  const shownModels = ql
    ? allModels.filter(
        ({ spec }) =>
          spec.type.toLowerCase().includes(ql) ||
          (spec.description ?? '').toLowerCase().includes(ql) ||
          spec.ports.some((p) => p.dimension.toLowerCase().includes(ql)),
      )
    : allModels;
  const shownObjects = ql ? searchObjects(ql) : objects;

  const count = view === 'objects' ? shownObjects.length : shownModels.length;

  return (
    <div className="landing">
      <header className="lnav">
        <div className="lnav-in">
          <button className="brand" onClick={onBack} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            <svg className="glyph" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0l8 8-8 8-8-8z" />
            </svg>
            ModelFlow
          </button>
          <div className="grow" />
          <a
            className="iconbtn"
            href="https://github.com/ModelFlow/modelflow"
            target="_blank"
            rel="noreferrer"
            title="View source on GitHub"
            aria-label="GitHub repository"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button className="iconbtn" title="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '☾' : '☀'}
          </button>
          <button className="pill" onClick={onDemo}>
            Live demo →
          </button>
        </div>
      </header>

      <div className="lib">
        <div className="lib-head">
          <h1>Model Library</h1>
          {view === 'objects' ? (
            <p className="lede">
              A cited parameter database of real-world objects. Every figure carries its unit and a link back to the
              source of record — so you can pull a trustworthy number for a panel, a battery, or a rocket stage without
              the datasheet scavenger hunt. Objects that map to a model can seed a live simulation directly.
            </p>
          ) : (
            <p className="lede">
              Reusable component models — each with a unit-clear interface and its logic in plain TypeScript. Drop any of
              these into a simulation; they compose because their ports declare real units and dimensions.
            </p>
          )}
        </div>

        <div className="lib-tabs">
          <div className="seg" role="tablist">
            <button role="tab" aria-selected={view === 'objects'} onClick={() => setView('objects')}>
              Objects · {objects.length}
            </button>
            <button role="tab" aria-selected={view === 'models'} onClick={() => setView('models')}>
              Models · {allModels.length}
            </button>
          </div>
        </div>

        <div className="lib-bar">
          <input
            className="lib-search"
            placeholder={view === 'objects' ? 'search objects, makers, parameters…' : 'search models, dimensions…'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="lib-count">
            {count} {view === 'objects' ? 'objects' : 'models'}
          </span>
        </div>

        {view === 'objects' ? (
          <div className="lib-grid">
            {shownObjects.map((o) => (
              <ObjectCard key={o.id} obj={o} />
            ))}
          </div>
        ) : (
          <div className="lib-grid">
            {shownModels.map(({ spec, published }) => (
              <ModelCard
                key={spec.type}
                spec={spec}
                published={published}
                onUnpublish={() => {
                  unpublishModel(spec.type);
                  setPubVer((v) => v + 1);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text, label = 'Copy JSON' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="tbtn"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  );
}

function ObjectCard({ obj }: { obj: LibraryObject }) {
  return (
    <div className="lib-card">
      <div className="card-top">
        <div className="lib-card-h">
          <span className="card-name">{obj.name}</span>
          <span className="lib-tag std">{obj.category}</span>
        </div>
        <div className="card-desc">{obj.summary}</div>
        {(obj.maker || obj.model) && (
          <div className="obj-maker">
            {obj.maker}
            {obj.maker && obj.model ? ' · ' : ''}
            {obj.model && (
              <>
                seeds <code>{obj.model}</code>
              </>
            )}
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="io-h">Parameters · {obj.params.length} cited</div>
        {obj.params.map((p, i) => (
          <div key={i}>
            <div className="io p">
              <span className="nm">{p.label}</span>
              <span className="un">{valueText(p.value, p.unit)}</span>
              <span className="dm">{p.mapsTo ? `→ ${p.mapsTo}` : ''}</span>
            </div>
            {(p.notes || p.url) && (
              <div className="io-meta">
                {p.notes && <span className="note">{p.notes}</span>}
                {p.url ? (
                  <a className="src-link" href={p.url} target="_blank" rel="noreferrer">
                    {p.source ?? 'source'} ↗
                  </a>
                ) : (
                  p.source && <span className="src-cite">{p.source}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="lib-actions">
        <CopyButton text={JSON.stringify(obj, null, 2)} />
        {obj.primarySource && (
          <a className="tbtn" href={obj.primarySource.url} target="_blank" rel="noreferrer">
            {obj.primarySource.citation} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function ModelCard({ spec, published, onUnpublish }: { spec: ModelSpec; published: boolean; onUnpublish: () => void }) {
  const [showSrc, setShowSrc] = useState(false);
  return (
    <div className="lib-card">
      <div className="card-top">
        <div className="lib-card-h">
          <span className="card-name">{spec.type}</span>
          {published ? (
            <span className="lib-tag pub">published by you</span>
          ) : (
            <span className="lib-tag std">standard</span>
          )}
        </div>
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
          const url = p.sourceUrl ?? p.sources?.find((s) => s.url)?.url;
          const cite = p.source ?? p.sources?.find((s) => s.citation)?.citation;
          return (
            <div key={p.name}>
              <div className="io p">
                <span className="nm">{p.name}</span>
                <span className="un">
                  {fmt(p.value)} {p.unit}
                </span>
                <span className="dm">{p.dimension}</span>
              </div>
              {(p.notes || url || cite) && (
                <div className="io-meta">
                  {p.notes && <span className="note">{p.notes}</span>}
                  {url ? (
                    <a className="src-link" href={url} target="_blank" rel="noreferrer">
                      {cite ?? 'source'} ↗
                    </a>
                  ) : (
                    cite && <span className="src-cite">{cite}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {spec.groupPorts.length > 0 && <div className="io-h">Group ports (dynamic)</div>}
        {spec.groupPorts.map((g) => (
          <div className="io g" key={g.name}>
            <span className="nm">⇉ {g.name}</span>
            <span className="dm">{g.channel.map((c) => `${c.field} ${c.dir === 'in' ? '←' : '→'}`).join('  ')}</span>
          </div>
        ))}
      </div>
      <div className="lib-actions">
        <CopyButton text={JSON.stringify(spec, null, 2)} label="Copy spec" />
        {spec.source.step && (
          <button className="tbtn" onClick={() => setShowSrc((s) => !s)}>
            {showSrc ? 'Hide logic' : 'View logic'}
          </button>
        )}
        {published && (
          <button className="tbtn danger" onClick={onUnpublish}>
            Unpublish
          </button>
        )}
      </div>
      {showSrc && spec.source.step && <pre className="src">{spec.source.step}</pre>}
    </div>
  );
}
