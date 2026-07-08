# ModelFlow

**An agent-friendly, hierarchical, composable simulation engine — Simulink in code.**

ModelFlow lets you build a simulation of *any* system out of small, reusable
model blocks, wire them together (explicitly, or through shared resource buses),
and run it fast and deterministically. Models are plain objects; scenarios are
plain JSON — so a person *or an LLM* can author them reliably.

> Rewritten in TypeScript in 2026 for performance and agent-authoring. The
> original 2020 Python prototype lives in git history at tag `legacy-python-2020`.

```
packages/
  core/   @modelflow/core   the engine — zero domain knowledge
  std/    @modelflow/std    generic primitives: Source, Sink, Storage, Controller, ArbitratedBus
  examples/                 runnable, domain-free demos (the tank loop)
tests/                      bun test
```

## A model is one object

No base class, no `super`. Declare ports, params, and state; write `step`.

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
    { key: 'src',  type: 'Source',     params: { maxFlow: 5 },                       connect: { cmd: 'src_cmd', flow: 'in_flow' } },
    { key: 'tank', type: 'Tank',        params: { capacity: 1000 },                   connect: { inflow: 'in_flow', outflow: 'drain', level: 'lvl' } },
    { key: 'sink', type: 'Sink',        params: { rate: 2 },                          connect: { draw: 'drain' } },
    { key: 'ctl',  type: 'Controller',  params: { setpoint: 500, band: 50, onValue: 5 }, connect: { measure: 'lvl', cmd: 'src_cmd' } },
  ],
};
```

Run it:

```ts
import { Engine } from '@modelflow/core';
const eng = new Engine(scenario.timestepSeconds, 0, scenario.seed);
eng.build(scenario, registry);   // validates wiring; throws with fixes on error
eng.run();
eng.history.series('lvl');        // the recorded time series
```

## Two ways to wire

- **Ports** — a single `out → in` edge for point-to-point signals (a sensor into
  a controller). Statically validated, single-driver, diagrammable.
- **Resource buses** — many-to-many shared commodities (power, water, labor…)
  with **nearest-owner** binding, pluggable **arbitration policies** (priority
  triage, reserves), subtree aggregation, and runtime re-parenting. One
  `arbitratedBus('power')` replaces a hand-written power grid + labor pool.

## Design principles

- **Deterministic** — `(scenario, seed)` → identical output. Per-instance RNG
  streams, fixed timestep, insertion-order evaluation (no topological sort).
- **Fast** — one reused `Float64Array` signal pool; no per-step allocation on
  the hot path.
- **Agent-friendly** — author-time checks catch a typo'd port before you run;
  `Engine.build` reports *every* scenario problem at once, each with the legal
  alternatives and a suggested fix.
- **Domain-free core** — Mars/Moon/data-center specifics live in domain packages
  that import ModelFlow; the engine emits a `Recording` any viewer can play.

## Develop

```
bun install
bun test
bun run example:tank
bun run typecheck
```

## License

MIT
