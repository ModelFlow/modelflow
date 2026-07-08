import { test, expect } from 'bun:test';
import { Engine, AggregateValidationError, type Scenario } from '@modelflow/core';
import { tankLoop, tankLoopRegistry } from '../packages/examples/src/tankLoop';

function runTank(): Engine {
  const eng = new Engine(tankLoop.timestepSeconds, 0, tankLoop.seed);
  eng.build(tankLoop, tankLoopRegistry);
  eng.run();
  return eng;
}

test('tank level settles into the controller hysteresis band', () => {
  const eng = runTank();
  const level = eng.history.series('lvl')!.toArray();
  expect(level.length).toBe(3600);
  // After settling, the bang-bang controller holds the level near setpoint 500
  // within band 50 plus small integration overshoot (rates <= 5 kg/s, dt 1s).
  const tail = level.slice(1000);
  for (const v of tail) {
    expect(v).toBeGreaterThan(430);
    expect(v).toBeLessThan(570);
  }
});

test('runs are bit-for-bit deterministic across two builds', () => {
  const a = runTank().history.series('lvl')!.toArray();
  const b = runTank().history.series('lvl')!.toArray();
  expect(a).toEqual(b);
});

test('a typo in a model type throws an aggregate error with a suggestion', () => {
  const bad: Scenario = {
    ...tankLoop,
    instances: [{ key: 'x', type: 'Tankk', connect: { level: 'l' } }],
  };
  const eng = new Engine(1, 0, 1);
  let err: unknown;
  try {
    eng.build(bad, tankLoopRegistry);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(AggregateValidationError);
  expect(String(err)).toContain('Did you mean "Tank"');
});

test('an undriven signal net is reported', () => {
  const bad: Scenario = {
    version: 1,
    name: 'undriven',
    seed: 1,
    timestepSeconds: 1,
    durationSeconds: 1,
    sampleEverySteps: 1,
    // Controller.measure reads net "floating" that nothing drives.
    instances: [{ key: 'ctl', type: 'Controller', connect: { measure: 'floating', cmd: 'c' } }],
  };
  const eng = new Engine(1, 0, 1);
  expect(() => eng.build(bad, tankLoopRegistry)).toThrow(/no driver/);
});
