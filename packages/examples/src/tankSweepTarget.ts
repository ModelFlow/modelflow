import { registry, type Scenario, type InstanceSpec, type Engine } from '@modelflow/core';
import { arbitratedBus, busSource, busLoad, Source, Sink, Controller, type SweepTarget } from '@modelflow/std';
import { Tank } from './tank';

/**
 * A sweep target: a power bus with prioritised loads plus a bank of feedback
 * tank loops. Each case varies the sink drain rate; the metric is the settled
 * level of the first tank. Deliberately non-trivial (37 instances × 10k steps)
 * so the parallel speedup is real, not dominated by worker startup.
 */
const reg = registry(arbitratedBus('power'), busSource('power'), busLoad('power'), Source, Sink, Controller, Tank);

interface Case {
  drain: number;
}

function scenario(c: Case): Scenario {
  const instances: InstanceSpec[] = [{ key: 'grid', type: 'Bus:power' }];
  for (let i = 0; i < 4; i++)
    instances.push({ key: `gen${i}`, type: 'Source:power', params: { supply: 30 }, join: [{ group: 'grid.sources' }] });
  for (let i = 0; i < 12; i++)
    instances.push({ key: `load${i}`, type: 'Load:power', params: { demand: 3 + (i % 4) }, connect: { served: `sv${i}` }, join: [{ group: 'grid.loads', meta: { band: i % 3 } }] });
  for (let i = 0; i < 5; i++) {
    instances.push({ key: `s${i}`, type: 'Source', params: { maxFlow: 5 }, connect: { cmd: `cmd${i}`, flow: `f${i}` } });
    instances.push({ key: `t${i}`, type: 'Tank', params: { capacity: 1000 }, connect: { inflow: `f${i}`, outflow: `d${i}`, level: `l${i}` } });
    instances.push({ key: `k${i}`, type: 'Sink', params: { rate: c.drain }, connect: { draw: `d${i}` } });
    instances.push({ key: `c${i}`, type: 'Controller', params: { setpoint: 500, band: 50, onValue: 5 }, connect: { measure: `l${i}`, cmd: `cmd${i}` } });
  }
  return {
    version: 1,
    name: 'tank-sweep',
    seed: 1,
    timestepSeconds: 1,
    durationSeconds: 10_000,
    sampleEverySteps: 1,
    commodities: [{ id: 'power', name: 'Power', unit: 'kW', kind: 'flow' }],
    instances,
  };
}

const target: SweepTarget<Case, { level0: number; served0: number }> = {
  registry: reg,
  scenario,
  metrics: (eng: Engine) => ({ level0: eng.netValue('l0'), served0: eng.netValue('sv0') }),
};

export const instancesPerCase = scenario({ drain: 1 }).instances.length;
export const stepsPerCase = 10_000;
export default target;
