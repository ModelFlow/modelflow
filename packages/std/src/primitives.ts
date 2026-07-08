import { defineModel, inPort, outPort, param } from '@modelflow/core';

/** Emits a constant value on `out`. */
export const Constant = defineModel({
  type: 'Constant',
  ports: { out: outPort('') },
  params: { value: param(0, '', 'Constant output value') },
  state: () => ({}),
  step(ctx) {
    ctx.out.out = ctx.params.value;
  },
  keyFigures: (ctx) => [['Value', ctx.params.value, '']],
});

/**
 * A commandable source: passes a commanded rate through, clamped to a maximum.
 * `cmd` is the requested rate (e.g. from a controller); `flow` is what it emits.
 */
export const Source = defineModel({
  type: 'Source',
  ports: { cmd: inPort('', { default: 0 }), flow: outPort('') },
  params: { maxFlow: param(Infinity, '', 'Maximum output rate') },
  state: () => ({}),
  step(ctx) {
    ctx.out.flow = Math.max(0, Math.min(ctx.params.maxFlow, ctx.in.cmd));
  },
});

/** A constant-rate sink: emits a fixed draw on `draw`. */
export const Sink = defineModel({
  type: 'Sink',
  ports: { draw: outPort('') },
  params: { rate: param(0, '', 'Constant draw rate') },
  state: () => ({}),
  step(ctx) {
    ctx.out.draw = ctx.params.rate;
  },
});

/** A bang-bang controller with hysteresis: commands `onValue` or 0. */
export const Controller = defineModel({
  type: 'Controller',
  ports: { measure: inPort(''), cmd: outPort('') },
  params: {
    setpoint: param(0, '', 'Target value'),
    band: param(0, '', 'Hysteresis half-width'),
    onValue: param(1, '', 'Command value when on'),
  },
  state: () => ({ on: false }),
  step(ctx) {
    const m = ctx.in.measure;
    if (m < ctx.params.setpoint - ctx.params.band) ctx.state.on = true;
    else if (m > ctx.params.setpoint + ctx.params.band) ctx.state.on = false;
    ctx.out.cmd = ctx.state.on ? ctx.params.onValue : 0;
  },
  keyFigures: (ctx) => [['On', ctx.state.on ? 1 : 0, '']],
});

/**
 * A generic stock: integrates (inflow − outflow) into a level, clamped to
 * [0, capacity]. The reusable version of the Tank teaching example.
 */
export const Storage = defineModel({
  type: 'Storage',
  ports: { inflow: inPort('', { default: 0 }), outflow: inPort('', { default: 0 }), level: outPort('') },
  params: {
    capacity: param(Infinity, '', 'Maximum stored amount'),
    initial: param(0, '', 'Initial stored amount'),
  },
  state: () => ({ amount: 0 }),
  init(ctx) {
    ctx.state.amount = ctx.params.initial;
  },
  step(ctx) {
    const next = ctx.state.amount + (ctx.in.inflow - ctx.in.outflow) * ctx.dt;
    ctx.state.amount = Math.max(0, Math.min(ctx.params.capacity, next));
    ctx.out.level = ctx.state.amount;
  },
  keyFigures: (ctx) => [['Level', ctx.state.amount, '']],
});
