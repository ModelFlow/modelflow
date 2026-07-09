import { Engine, registry, type Scenario, type InstanceSpec } from '@modelflow/core';
import { arbitratedBus, busSource, busLoad, Storage, Source, Sink, Controller } from '@modelflow/std';
import { Tank } from './tank';

/**
 * Throughput benchmark. Builds a realistically-sized scenario (a power bus with
 * many prioritised loads + a bank of feedback tank loops) and measures raw
 * model-steps/sec — the number that actually decides whether TS is fast enough.
 */
const reg = registry(
  arbitratedBus('power'), busSource('power'), busLoad('power'),
  Storage, Source, Sink, Controller, Tank,
);

function buildScenario(nLoads: number, nTanks: number): Scenario {
  const instances: InstanceSpec[] = [{ key: 'grid', type: 'Bus:power' }];
  for (let i = 0; i < 8; i++) instances.push({ key: `gen${i}`, type: 'Source:power', parent: 'grid', params: { supply: 40 } });
  for (let i = 0; i < nLoads; i++)
    instances.push({ key: `load${i}`, type: 'Load:power', parent: 'grid', params: { demand: 3 + (i % 5), band: i % 4 }, connect: { served: `sv${i}` } });
  // Independent feedback tank loops (Source->Tank->Sink + Controller).
  for (let i = 0; i < nTanks; i++) {
    instances.push({ key: `s${i}`, type: 'Source', params: { maxFlow: 5 }, connect: { cmd: `cmd${i}`, flow: `f${i}` } });
    instances.push({ key: `t${i}`, type: 'Tank', params: { capacity: 1000 }, connect: { inflow: `f${i}`, outflow: `d${i}`, level: `l${i}` } });
    instances.push({ key: `k${i}`, type: 'Sink', params: { rate: 2 }, connect: { draw: `d${i}` } });
    instances.push({ key: `c${i}`, type: 'Controller', params: { setpoint: 500, band: 50, onValue: 5 }, connect: { measure: `l${i}`, cmd: `cmd${i}` } });
  }
  return {
    version: 1, name: 'bench', seed: 1,
    timestepSeconds: 3600, durationSeconds: 3600, sampleEverySteps: 1,
    commodities: [{ id: 'power', name: 'Power', unit: 'kW', kind: 'flow' }],
    instances,
  };
}

const nLoads = 60;
const nTanks = 40;
const scn = buildScenario(nLoads, nTanks);
const nInstances = scn.instances.length;
const STEPS = 200_000;

const eng = new Engine(scn.timestepSeconds, 0, scn.seed);
eng.build(scn, reg);

// warm up the JIT
for (let i = 0; i < 5_000; i++) eng.step();

const t0 = performance.now();
for (let i = 0; i < STEPS; i++) eng.step();
const ms = performance.now() - t0;

const modelSteps = STEPS * nInstances;
console.log(`instances:        ${nInstances}  (1 bus, 8 gens, ${nLoads} loads, ${nTanks} tank loops)`);
console.log(`steps:            ${STEPS.toLocaleString()}`);
console.log(`wall:             ${ms.toFixed(0)} ms`);
console.log(`steps/sec:        ${Math.round(STEPS / (ms / 1000)).toLocaleString()}`);
console.log(`model-steps/sec:  ${Math.round(modelSteps / (ms / 1000)).toLocaleString()}`);
console.log(`ns per model-step: ${((ms * 1e6) / modelSteps).toFixed(1)} ns`);
