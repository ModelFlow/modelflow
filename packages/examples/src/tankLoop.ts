import { registry, type Scenario } from '@modelflow/core';
import { Source, Sink, Controller } from '@modelflow/std';
import { Tank } from './tank';

/** Registry of every model type the tank-loop scenario references. */
export const tankLoopRegistry = registry(Source, Sink, Controller, Tank);

/**
 * Source → Tank → Sink, with a hysteresis Controller reading the tank level
 * and commanding the source. A closed feedback loop wired entirely as data.
 *
 *   ctl.cmd ─▶ src.cmd → src.flow ─▶ tank.inflow
 *   sink.draw ─▶ tank.outflow
 *   tank.level ─▶ ctl.measure  (feedback)
 */
export const tankLoop: Scenario = {
  version: 1,
  name: 'tank-loop',
  seed: 42,
  timestepSeconds: 1,
  durationSeconds: 3600,
  sampleEverySteps: 10,
  instances: [
    { key: 'src', type: 'Source', params: { maxFlow: 5 }, connect: { cmd: 'src_cmd', flow: 'in_flow' } },
    { key: 'tank', type: 'Tank', params: { capacity: 1000 }, connect: { inflow: 'in_flow', outflow: 'drain', level: 'lvl' } },
    { key: 'sink', type: 'Sink', params: { rate: 2 }, connect: { draw: 'drain' } },
    { key: 'ctl', type: 'Controller', params: { setpoint: 500, band: 50, onValue: 5 }, connect: { measure: 'lvl', cmd: 'src_cmd' } },
  ],
};
