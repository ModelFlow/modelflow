import { defineModel, inPort, outPort, param } from '@modelflow/core';

/**
 * The ModelFlow "hello world": a tank that integrates inflow − outflow into a
 * stored mass, clamped to its capacity. Fifteen lines, no base class, no
 * domain terms — the whole authoring surface on display.
 */
export const Tank = defineModel({
  type: 'Tank',
  ports: {
    inflow: inPort('kg/s', { default: 0 }),
    outflow: inPort('kg/s', { default: 0 }),
    level: outPort('kg'),
  },
  params: { capacity: param(1000, 'kg', 'Max stored mass') },
  state: () => ({ mass: 500 }),
  step(ctx) {
    ctx.state.mass = Math.max(
      0,
      Math.min(ctx.params.capacity, ctx.state.mass + (ctx.in.inflow - ctx.in.outflow) * ctx.dt),
    );
    ctx.out.level = ctx.state.mass;
    if (ctx.state.mass <= 0) ctx.log('warn', 'tank dry');
  },
  keyFigures: (ctx) => [
    ['Level', ctx.state.mass, 'kg'],
    ['Fill', (100 * ctx.state.mass) / ctx.params.capacity, '%'],
  ],
});
