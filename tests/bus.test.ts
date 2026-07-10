import { test, expect } from 'bun:test';
import { Engine, registry, AggregateValidationError, type Scenario } from '@modelflow/core';
import { arbitratedBus, busSource, busLoad } from '@modelflow/std';

const reg = registry(arbitratedBus('power'), busSource('power'), busLoad('power'));

test('the bus (an ordinary model) serves the high-priority band first, pro-rata on shortfall', () => {
  const scn: Scenario = {
    version: 1,
    name: 'bus-test',
    seed: 1,
    timestepSeconds: 1,
    durationSeconds: 3,
    sampleEverySteps: 1,
    commodities: [{ id: 'power', name: 'Power', unit: 'kW', kind: 'flow' }],
    instances: [
      { key: 'grid', type: 'Bus:power' },
      { key: 'gen', type: 'Source:power', params: { supply: 10 }, join: [{ group: 'grid.sources' }] },
      { key: 'crit', type: 'Load:power', params: { demand: 6 }, connect: { served: 'crit_served' }, join: [{ group: 'grid.loads', meta: { band: 0 } }] },
      { key: 'low', type: 'Load:power', params: { demand: 8 }, connect: { served: 'low_served' }, join: [{ group: 'grid.loads', meta: { band: 1 } }] },
    ],
  };
  const eng = new Engine(1, 0, 1);
  eng.build(scn, reg);
  eng.run();

  // Supply 10: band-0 critical (demand 6) fully served; band-1 low gets the
  // remaining 4 of its 8 (pro-rata within the leftover). Identical to the old
  // engine-privileged bus — the numbers must not move.
  expect(eng.netValue('crit_served')).toBeCloseTo(6, 6);
  expect(eng.netValue('low_served')).toBeCloseTo(4, 6);
  expect(eng.history.series('bus.power.unmet')!.latest).toBeCloseTo(4, 6);
  expect(eng.history.series('bus.power.served')!.latest).toBeCloseTo(10, 6);
  expect(eng.history.series('bus.power.offered')!.latest).toBeCloseTo(10, 6);
});

test('joining a group that does not exist is a validation error', () => {
  const scn: Scenario = {
    version: 1,
    name: 'orphan-load',
    seed: 1,
    timestepSeconds: 1,
    durationSeconds: 1,
    sampleEverySteps: 1,
    instances: [{ key: 'load', type: 'Load:power', params: { demand: 5 }, join: [{ group: 'grid.loads' }] }],
  };
  const eng = new Engine(1, 0, 1);
  let err: unknown;
  try {
    eng.build(scn, reg);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(AggregateValidationError);
  expect(String(err)).toContain('no group port');
});
