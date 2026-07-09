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
          <div className="eyebrow">Open-source simulation engine</div>
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
          <p className="ex-foot">
            The same engine powers a full Mars-habitat simulation — this microgrid is one small slice of it.
          </p>
        </div>
      </section>

      <footer className="lfoot">
        <div className="wrap">
          <span>ModelFlow</span>
          <span className="dim">Composable simulation · MIT licensed</span>
        </div>
      </footer>
    </div>
  );
}
