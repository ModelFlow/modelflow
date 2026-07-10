import { defineModel, inPort, outPort, param } from '@modelflow/core';

/**
 * Generic energy-conversion models. Still domain-neutral in spirit — a panel is
 * "irradiance × area × efficiency", an inverter is "in × efficiency" — but named
 * for the real components the Model Library's objects map onto (SunPower Maxeon
 * → SolarPanel, Enphase IQ8 → Inverter).
 */

/** Photovoltaic array: instantaneous DC power from plane-of-array irradiance. */
export const SolarPanel = defineModel({
  type: 'SolarPanel',
  ports: { irradiance: inPort('W/m^2'), power: outPort('W') },
  params: {
    area: param(10, 'm^2', 'Total active module area'),
    efficiency: param(0.22, 'frac', 'Reference conversion efficiency (STC)', {
      min: 0,
      max: 1,
      source: 'NREL Best Research-Cell Efficiency Chart',
      sourceUrl: 'https://www.nrel.gov/pv/cell-efficiency.html',
      notes: 'Commercial monocrystalline modules run ~0.20–0.23 at Standard Test Conditions.',
    }),
  },
  state: () => ({}),
  step(ctx) {
    ctx.out.power = ctx.in.irradiance * ctx.params.area * ctx.params.efficiency;
  },
  keyFigures: (ctx) => [['Output', ctx.out.power, 'W']],
});

/** DC→AC (or DC→DC) converter: output is input scaled by a fixed efficiency. */
export const Inverter = defineModel({
  type: 'Inverter',
  ports: { dc: inPort('kW'), ac: outPort('kW') },
  params: {
    efficiency: param(0.96, 'frac', 'Conversion efficiency', {
      min: 0,
      max: 1,
      notes: 'CEC-weighted efficiency for a modern string/microinverter is typically 0.96–0.98.',
    }),
  },
  state: () => ({}),
  // A bus feeder: write output in declare so an arbitrated bus sees it in resolve.
  declare(ctx) {
    ctx.out.ac = ctx.in.dc * ctx.params.efficiency;
  },
  step() {},
  keyFigures: (ctx) => [['Output', ctx.out.ac, 'kW']],
});
