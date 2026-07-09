import { test, expect } from 'bun:test';
import { defineModel, inPort, outPort, param, registry, Engine, AggregateValidationError, type Scenario } from '@modelflow/core';

// A solar-like source that outputs in WATTS.
const WattSource = defineModel({
  type: 'WattSource',
  ports: { power: outPort('W') },
  params: { rating: param(2000, 'W', 'Output power') },
  state: () => ({}),
  step(ctx) {
    ctx.out.power = ctx.params.rating;
  },
});

// A consumer that thinks in KILOWATTS and echoes what it received (in kW).
const KwConsumer = defineModel({
  type: 'KwConsumer',
  ports: { draw: inPort('kW'), echo: outPort('kW') },
  state: () => ({}),
  step(ctx) {
    ctx.out.echo = ctx.in.draw;
  },
});

// A mass-flow source (kg/s) — dimensionally INCOMPATIBLE with a power input.
const FlowSource = defineModel({
  type: 'FlowSource',
  ports: { flow: outPort('kg/s') },
  state: () => ({}),
  step(ctx) {
    ctx.out.flow = 5;
  },
});

const reg = registry(WattSource, KwConsumer, FlowSource);

test('W output auto-converts to a kW input', () => {
  const scn: Scenario = {
    version: 1, name: 'w-to-kw', seed: 1, timestepSeconds: 1, durationSeconds: 1, sampleEverySteps: 1,
    instances: [
      { key: 'solar', type: 'WattSource', params: { rating: 2000 }, connect: { power: 'grid' } },
      { key: 'load', type: 'KwConsumer', connect: { draw: 'grid', echo: 'out_kw' } },
    ],
  };
  const eng = new Engine(1, 0, 1);
  eng.build(scn, reg);
  eng.run();
  // The net carries 2000 W (driver's unit); the kW consumer read 2 kW and echoed it.
  expect(eng.netValue('grid')).toBeCloseTo(2000, 6);
  expect(eng.netValue('out_kw')).toBeCloseTo(2, 6);
});

test('wiring mass-flow into a power input is rejected at build', () => {
  const scn: Scenario = {
    version: 1, name: 'bad-units', seed: 1, timestepSeconds: 1, durationSeconds: 1, sampleEverySteps: 1,
    instances: [
      { key: 'src', type: 'FlowSource', connect: { flow: 'grid' } },
      { key: 'load', type: 'KwConsumer', connect: { draw: 'grid', echo: 'e' } },
    ],
  };
  const eng = new Engine(1, 0, 1);
  let err: unknown;
  try {
    eng.build(scn, reg);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(AggregateValidationError);
  expect(String(err)).toContain('unit mismatch');
  expect(String(err)).toMatch(/power|mass flow/);
});
