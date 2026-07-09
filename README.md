# ModelFlow

**Model-Based Design for Models.**

Reusable, composable models — at any level of detail — for humanity's hardest
system-simulation problems.

ModelFlow builds a simulation of *any* system out of small, **reusable,
composable** models, each dialable from a coarse estimate to full physics, and
wires them together (with typed ports or shared resource buses) to take on the
toughest problems: life support on Mars, power on the Moon, compute in orbit.
Models are plain TypeScript objects; scenarios are plain JSON, so a person *or an
LLM* can author them reliably.

### ▶ Live demo — [modelflow-microgrid.netlify.app](https://modelflow-microgrid.netlify.app)

An interactive solar-microgrid example running in the browser, plus a generic
inspector (connection graph, live charts, editable model logic).

> Rewritten in TypeScript in 2026 for performance and agent-authoring. The
> original 2020 Python prototype lives in git history at tag `legacy-python-2020`.

---

## Packages

```
packages/
  core/       @modelflow/core   the engine — zero domain knowledge
  std/        @modelflow/std     generic primitives + policies + parallel sweeps
  studio/     @modelflow/studio  a generic Vite/React inspector UI (the live demo)
  examples/                      runnable, domain-free demos + benchmarks
tests/                           bun test
```

`@modelflow/std` ships `Source`, `Sink`, `Storage`, `Converter`, `Controller`,
`Constant`, and `arbitratedBus` with the `priorityProRata` allocation policy.

---

## A model is one object

No base class, no `super`. Declare ports (each with a **unit**), params, and
state; write `step`. Author-time checks reject a typo'd port before you ever run.

```ts
import { defineModel, inPort, outPort, param } from '@modelflow/core';

export const Tank = defineModel({
  type: 'Tank',
  ports: { inflow: inPort('kg/s'), outflow: inPort('kg/s'), level: outPort('kg') },
  params: { capacity: param(1000, 'kg', 'Max stored mass') },
  state: () => ({ mass: 500 }),
  step(ctx) {
    ctx.state.mass = Math.max(0, Math.min(ctx.params.capacity,
      ctx.state.mass + (ctx.in.inflow - ctx.in.outflow) * ctx.dt));
    ctx.out.level = ctx.state.mass;
  },
});
```

## A scenario is data

A hierarchy of instances with per-instance overrides and wiring. `connect` maps
a port to a named net; two ports on the same net are wired together.

```ts
const scenario = {
  version: 1, name: 'tank-loop', seed: 42,
  timestepSeconds: 1, durationSeconds: 3600, sampleEverySteps: 10,
  instances: [
    { key: 'src',  type: 'Source',     params: { maxFlow: 5 },                          connect: { cmd: 'src_cmd', flow: 'in_flow' } },
    { key: 'tank', type: 'Tank',       params: { capacity: 1000 },                       connect: { inflow: 'in_flow', outflow: 'drain', level: 'lvl' } },
    { key: 'sink', type: 'Sink',       params: { rate: 2 },                              connect: { draw: 'drain' } },
    { key: 'ctl',  type: 'Controller', params: { setpoint: 500, band: 50, onValue: 5 },  connect: { measure: 'lvl', cmd: 'src_cmd' } },
  ],
};
```

Run it:

```ts
import { Engine, registry } from '@modelflow/core';

const eng = new Engine(scenario.timestepSeconds, 0, scenario.seed);
eng.build(scenario, registry(/* models */));  // validates wiring; throws with fixes on error
eng.run();
eng.history.series('lvl');                     // the recorded time series
eng.structure();                               // nodes + edges, for a diagram
eng.instanceViews();                           // live params / status / key figures
```

## Two ways to wire

- **Ports** — a single `out → in` edge for point-to-point signals (a sensor into
  a controller). Statically validated, single-driver, diagrammable.
- **Resource buses** — many-to-many shared commodities (power, water, labor…)
  with **nearest-owner** binding, pluggable **arbitration policies** (priority
  triage, reserves), subtree aggregation, and runtime re-parenting. One
  `arbitratedBus('power')` replaces a hand-written power grid + labor pool.

## Levels of detail

The same model can run at different **fidelities**. A model declares the level it
supports; a scenario picks per instance (`fidelity: 0 | 1 | 2`) and `ctx.fidelity`
lets the `step` branch — a distilled coefficient for fast multi-year sweeps, an
analytic formula, or resolved physics when a single number decides the outcome.
You dial detail up or down **without rewiring** the model.

## Units that convert themselves

Every port and param declares a unit. ModelFlow does real dimensional analysis,
so it **auto-converts compatible units on the wire** and **rejects incompatible
ones at build**.

```ts
import { convert } from '@modelflow/core';

convert(1, 'kW', 'W');        // 1000
convert(0, '°C', 'K');        // 273.15
convert(1, 'kg/s', 't/day');  // 86.4
```

Wire a model that outputs `W` into one that declares its input in `kW`, and the
value is converted for you. Wire `kg/s` into a `W` input, and `Engine.build`
throws: *“unit mismatch … power vs mass flow.”* The parser understands SI
prefixes and compound units (`W/m^2`, `kW·h`, `J/(kg·K)`, `mmHg`, affine `°C`).

## Publishable components

`modelSpec(def)` / `catalog(registry)` describe every model as a portable
component — each interface point annotated with its unit **and** physical
dimension **and** provenance — so a model can be published and dropped into
another simulation with its contract fully understood.

```
SolarPanel — Photovoltaic array: irradiance + cell temperature → DC power.
  → irradiance   W/m^2   [power density]
  → cellTemp     °C      [temperature]
  ← power        W       [power]
  • efficiency   0.22    frac    [dimensionless]   src: Spectrolab XTJ Prime
```

## Deterministic & fast

- **Deterministic** — `(scenario, seed)` → identical output. Per-instance RNG
  streams, fixed timestep, insertion-order evaluation (no topological sort).
- **Fast** — one reused `Float64Array` signal pool, zero per-step allocation.
  **~33M model-steps/sec** single-threaded (recording on); **~49M/sec** in
  compute-only mode.
- **Parallel sweeps** — `runSweep()` fans a Monte-Carlo / trade study across
  Web Workers (Bun *and* the browser). Measured **~4.7× on 10 cores
  (231M model-steps/sec)**, results bit-identical to single-thread.

```ts
import { runSweep } from '@modelflow/std';
const results = await runSweep({ module: './myTarget.ts', cases, workers: 8 });
```

## ModelFlow Studio

A **generic** inspector UI (`packages/studio`) driven purely by engine
introspection — point it at any scenario and get:

- an **assets** table with live key figures,
- a **connection graph** (React Flow) with unit-labelled signal edges and
  arbitrated bus edges,
- live **time-series charts**, and
- a **component catalog** where each model's TypeScript `step(ctx)` is shown and
  can be **edited and re-run live**.

Light and dark themed. It's the [live demo](https://modelflow-microgrid.netlify.app).

```
bun run --cwd packages/studio dev     # → http://localhost:5273
```

## Domain-free core

Mars / Moon / orbital-data-center specifics live in domain packages that import
ModelFlow; the engine emits a `Recording` (per-signal series + frames + events +
key figures) that any viewer can play. The core knows nothing about any of them.

## Develop

```
bun install
bun test                       # unit + integration + units + sweep tests
bun run typecheck
bun run example:tank           # run the tank-loop example
bun run packages/examples/src/bench.ts        # single-thread throughput
bun run packages/examples/src/benchSweep.ts   # parallel sweep throughput
bun run --cwd packages/studio dev             # the Studio UI
```

## License

MIT
