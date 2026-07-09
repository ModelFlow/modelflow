import { defineModel, inPort, outPort, param } from '@modelflow/core';

/** A day/night irradiance source (W/m²) — a smooth sunrise-to-sunset bump. */
export const DiurnalIrradiance = defineModel({
  type: 'DiurnalIrradiance',
  description: 'Diurnal solar irradiance over a day cycle.',
  isEnvProvider: true,
  ports: { irradiance: outPort('W/m^2', { desc: 'Plane-of-array irradiance' }) },
  params: {
    peak: param(1000, 'W/m^2', 'Noon peak irradiance'),
    periodSeconds: param(86400, 's', 'Day length'),
  },
  state: () => ({}),
  step(ctx) {
    const phase = (ctx.t % ctx.params.periodSeconds) / ctx.params.periodSeconds; // 0..1 over a day
    // Peak at solar noon (phase 0.5); dark before 6am / after 6pm.
    ctx.out.irradiance = Math.max(0, ctx.params.peak * Math.sin(2 * Math.PI * (phase - 0.25)));
  },
  keyFigures: (ctx) => [['Irradiance', ctx.out.irradiance, 'W/m²']],
});

/**
 * Inverter/tie: reads a panel's DC power (declared in kW, so ModelFlow
 * auto-converts the panel's W output) and offers it onto the power bus.
 */
export const Inverter = defineModel({
  type: 'Inverter',
  description: 'DC→bus tie: reads panel power and offers it to the grid.',
  ports: { dc: inPort('kW', { desc: 'Panel DC power (auto-converted from W)' }) },
  buses: { grid: { commodity: 'power', role: 'offer', unit: 'kW' } },
  params: { efficiency: param(0.96, 'frac', 'Inverter efficiency', { min: 0, max: 1 }) },
  state: () => ({}),
  declare(ctx) {
    ctx.bus.grid.offer = ctx.in.dc * ctx.params.efficiency;
  },
  step() {},
  keyFigures: (ctx) => [['Offering', ctx.in.dc * ctx.params.efficiency, 'kW']],
});
