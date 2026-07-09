const TANK_SRC = `import { defineModel, inPort, outPort, param } from '@modelflow/core';

export const Tank = defineModel({
  type: 'Tank',
  ports: {
    inflow:  inPort('kg/s'),
    outflow: inPort('kg/s'),
    level:   outPort('kg'),
  },
  params: { capacity: param(1000, 'kg', 'Max stored mass') },
  state: () => ({ mass: 500 }),
  step(ctx) {
    ctx.state.mass = Math.max(0, Math.min(ctx.params.capacity,
      ctx.state.mass + (ctx.in.inflow - ctx.in.outflow) * ctx.dt));
    ctx.out.level = ctx.state.mass;
  },
});`;

const CONCEPTS: Array<{ t: string; d: string }> = [
  {
    t: 'Reusable & composable',
    d: 'Model something once — a solar array, an electrolyzer, a crew member — then reuse and nest it. Small models compose into subsystems, and subsystems into an entire base.',
  },
  {
    t: 'Levels of detail, on demand',
    d: 'Run each model at the fidelity the question needs — a distilled coefficient for fast multi-year sweeps, or resolved physics when a single number decides the outcome. Swap detail without rewiring.',
  },
  {
    t: 'Two ways to wire',
    d: 'Typed ports for point-to-point signals, and named resource buses (power, water, O₂…) for shared supply that’s split between consumers by priority.',
  },
  {
    t: 'Units convert themselves',
    d: 'Declare a port in kW and feed it a W output — ModelFlow converts on the wire. Connect power to a mass-flow input and it’s rejected at build, with a plain-English error.',
  },
  {
    t: 'Deterministic & fast',
    d: 'One typed-array signal pool, a seeded RNG per model, a fixed timestep. Tens of millions of model-steps per second, and parameter sweeps fan out across every core.',
  },
  {
    t: 'Agent-friendly',
    d: 'Models are plain TypeScript; scenarios are JSON, validated with errors that name the fix. The whole surface is designed so a person — or an LLM — gets a new model right on the first try.',
  },
];

export function Landing({
  theme,
  setTheme,
  onLaunch,
}: {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onLaunch: () => void;
}) {
  return (
    <div className="landing">
      <header className="lnav">
        <div className="lnav-in">
          <div className="brand">
            <svg className="glyph" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0l8 8-8 8-8-8z" />
            </svg>
            ModelFlow
          </div>
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
          <button className="pill" onClick={onLaunch}>
            Live demo →
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-in">
          <div className="eyebrow">Model-Based Design for Models</div>
          <h1>
            Model humanity’s <span className="accent">hardest systems.</span>
          </h1>
          <p className="sub">
            ModelFlow builds simulations from reusable, composable models — each dialed to whatever level of detail the
            question needs — to take on the toughest system problems: keeping people alive on Mars, powering a base on
            the Moon, running a data center in orbit.
          </p>
          <div className="hero-cta">
            <button className="pill lg" onClick={onLaunch}>
              Launch the live demo →
            </button>
            <a className="pill secondary lg" href="#example">
              See the example
            </a>
          </div>
        </div>
      </section>

      <section className="concepts">
        <div className="wrap">
          <div className="grid6">
            {CONCEPTS.map((c) => (
              <div className="concept" key={c.t}>
                <div className="c-t">{c.t}</div>
                <div className="c-d">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="codeblock">
        <div className="wrap two">
          <div>
            <h2>A model, in full</h2>
            <p className="lede">
              This is the entire authoring surface. Ports carry units. State is any object. The <code>step</code>
              function reads inputs and writes outputs each timestep. That’s it — drop this into any scenario and it
              works.
            </p>
          </div>
          <pre className="hljs">{TANK_SRC}</pre>
        </div>
      </section>

      <section className="example" id="example">
        <div className="wrap">
          <div className="ex-head">
            <h2>Example simulation — solar microgrid</h2>
            <p className="lede">
              The sun drives two photovoltaic arrays that output <b>watts</b>. Inverters tie them to a shared power bus —
              and because each inverter declares its input in <b>kilowatts</b>, ModelFlow auto-converts W→kW on the wire.
              Three loads draw from the bus at different priorities; when the sun dips and supply falls short, the
              lowest-priority load (an ISRU plant) is shed first. Everything is live — the same engine, running in your
              browser.
            </p>
          </div>
          <div className="ex-flow">
            <span className="b">Sun</span>
            <span className="arr">→</span>
            <span className="b">PV arrays (W)</span>
            <span className="arr">→</span>
            <span className="b">Inverters (kW)</span>
            <span className="arr">→</span>
            <span className="b bus">Power bus</span>
            <span className="arr">→</span>
            <span className="b">Prioritised loads</span>
          </div>
          <div className="ex-cta">
            <button className="pill lg" onClick={onLaunch}>
              Open the live demo →
            </button>
          </div>
        </div>
      </section>

      <footer className="lfoot">
        <div className="wrap">
          <span>ModelFlow</span>
          <a className="foot-link" href="https://github.com/ModelFlow/modelflow" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <span className="dim">MIT licensed</span>
        </div>
      </footer>
    </div>
  );
}
