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

const MCP_SRC = `// An agent building a simulation asks the ModelFlow MCP server:

search_objects({ query: "home battery" })
→ [{ id: "tesla-powerwall-3", name: "Tesla Powerwall 3",
     category: "Energy storage", model: "Storage" }, …]

get_object({ id: "tesla-powerwall-3" })
→ { name: "Tesla Powerwall 3", model: "Storage",
    params: [
      { label: "Usable energy", value: 13.5, unit: "kWh",
        mapsTo: "capacity",
        source: "Powerwall 3 Datasheet",
        url: "https://energylibrary.tesla.com/…" },
      { label: "Round-trip efficiency", value: 89, unit: "%", … },
      …
    ] }

// Every figure is unit-tagged and sourced — ready to wire
// straight into a scenario, no datasheet hunt required.`;

const CONCEPTS: Array<{ t: string; d: string }> = [
  {
    t: 'Reusable & composable',
    d: 'Model something once — a solar array, a pump, a battery — then reuse and nest it. Small models compose into subsystems, and subsystems into an entire plant.',
  },
  {
    t: 'Levels of detail, on demand',
    d: 'Run each model at the fidelity the question needs — a distilled coefficient for fast multi-year sweeps, or resolved physics when a single number decides the outcome. Swap detail without rewiring.',
  },
  {
    t: 'Signals and shared hubs',
    d: 'Typed ports wire point-to-point. Dynamic group ports let any number of models plug into a hub — a power bus that pools every source and splits it between consumers by priority is just an ordinary model, no special engine support.',
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
    t: 'Built for people and agents',
    d: 'Models are plain TypeScript; scenarios are JSON, validated with errors that name the fix. The object library is reachable over MCP — so a person or an AI agent gets a real, sourced model right the first time.',
  },
];

export function Landing({
  theme,
  setTheme,
  onLaunch,
  onLibrary,
}: {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onLaunch: () => void;
  onLibrary: () => void;
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
          <button className="lnav-link" onClick={onLibrary}>
            Model Library
          </button>
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
            Model any system, then <span className="accent">trust the numbers.</span>
          </h1>
          <p className="sub">
            ModelFlow is a generic, composable simulation engine — reusable models in plain TypeScript, scenarios in
            JSON, units that convert themselves — paired with a cited library of real-world objects, so every parameter
            in your model traces back to a source. Built to be driven by engineers and AI agents alike.
          </p>
          <div className="hero-cta">
            <button className="pill lg" onClick={onLaunch}>
              Launch the live demo →
            </button>
            <button className="pill secondary lg" onClick={onLibrary}>
              Browse the Model Library
            </button>
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

      <section className="codeblock alt">
        <div className="wrap two">
          <div>
            <h2>One cited source of truth for real-world parameters</h2>
            <p className="lede">
              Modeling something real means hunting its numbers across datasheets, spec pages and Wikipedia tables — then
              hoping you copied them right. The Model Library gathers real objects — a SunPower panel, a Tesla Powerwall,
              a Starship stage — with every figure in its unit and a link back to the source of record. Objects that map
              to a model seed a live simulation directly.
            </p>
            <button className="pill lg" onClick={onLibrary}>
              Browse the Model Library →
            </button>
          </div>
          <div className="lib-card peek">
            <div className="card-top">
              <div className="lib-card-h">
                <span className="card-name">Tesla Powerwall 3</span>
                <span className="lib-tag std">Energy storage</span>
              </div>
              <div className="obj-maker">
                Tesla · seeds <code>Storage</code>
              </div>
            </div>
            <div className="card-body">
              <div className="io p">
                <span className="nm">Usable energy</span>
                <span className="un">13.5 kWh</span>
                <span className="dm">→ capacity</span>
              </div>
              <div className="io-meta">
                <a className="src-link" href="https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf" target="_blank" rel="noreferrer">
                  Powerwall 3 Datasheet ↗
                </a>
              </div>
              <div className="io p">
                <span className="nm">Continuous power</span>
                <span className="un">11.5 kW</span>
                <span className="dm" />
              </div>
              <div className="io p">
                <span className="nm">Round-trip efficiency</span>
                <span className="un">89 %</span>
                <span className="dm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="codeblock">
        <div className="wrap two">
          <div>
            <h2>Agents query it over MCP</h2>
            <p className="lede">
              ModelFlow ships an <b>MCP server</b> that exposes the object and model library as tools. An agent building
              a simulation can look up a real component’s parameters — sourced and unit-tagged — and get back structured
              data it can wire straight into a scenario. The library is the target audience’s single lookup for “what are
              the real numbers for <i>this</i> thing?”
            </p>
          </div>
          <pre className="hljs">{MCP_SRC}</pre>
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
              lowest-priority load (EV charging) is shed first. Everything is live — the same engine, running in your
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
          <button className="foot-link" onClick={onLibrary}>
            Model Library
          </button>
          <a className="foot-link" href="https://github.com/ModelFlow/modelflow" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <span className="dim">MIT licensed</span>
        </div>
      </footer>
    </div>
  );
}
