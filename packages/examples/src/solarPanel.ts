import { defineModel, inPort, outPort, param } from '@modelflow/core';

/**
 * A publishable component: a photovoltaic panel — with three LEVELS OF DETAIL.
 * The whole idea of ModelFlow's fidelity: start simple for back-of-envelope
 * intuition, then add complexity only where it moves the answer.
 *   L0 — irradiance × area × efficiency        (back-of-envelope)
 *   L1 — + temperature derate                  (default)
 *   L2 — + dust / soiling loss                 (detailed)
 * Every interface point is unit-annotated, so this drops into any simulation —
 * ModelFlow converts W↔kW, °C↔K, W/m²↔kW/m² automatically at the wire.
 */
export const SolarPanel = defineModel({
  type: 'SolarPanel',
  description: 'Photovoltaic array → DC power. L0 irradiance-only · L1 + temperature · L2 + dust.',
  fidelity: 1,
  maxFidelity: 2,
  ports: {
    irradiance: inPort('W/m^2', { desc: 'Plane-of-array solar irradiance' }),
    cellTemp: inPort('°C', { default: 25, desc: 'Cell temperature (used at L1+)' }),
    power: outPort('W', { desc: 'DC electrical output' }),
  },
  params: {
    area: param(10, 'm^2', 'Total active cell area'),
    efficiency: param(0.22, 'frac', 'Reference conversion efficiency (STC)', {
      min: 0,
      max: 1,
      source: 'Spectrolab XTJ Prime datasheet',
      sourceUrl: 'https://www.spectrolab.com/DataSheets/cells/XTJ_Prime.pdf',
      notes: 'Beginning-of-life efficiency at Standard Test Conditions (AM0, 25 °C). Derate ~1%/yr for radiation damage on multi-year missions.',
    }),
    tempCoeff: param(-0.0035, '1/K', 'Power temperature coefficient (L1+)', {
      max: 0,
      source: 'Typical triple-junction III-V cell',
      notes: 'Fractional power loss per kelvin above the 25 °C reference temperature.',
    }),
    soiling: param(0.08, 'frac', 'Dust / soiling loss fraction (L2)', {
      min: 0,
      max: 1,
      source: 'Mars dust deposition studies',
      notes: 'Fraction of output lost to dust accumulation on the array between cleanings.',
    }),
  },
  state: () => ({}),
  step(ctx) {
    let p = ctx.in.irradiance * ctx.params.area * ctx.params.efficiency; // L0: back-of-envelope
    if (ctx.fidelity >= 1) p *= 1 + ctx.params.tempCoeff * (ctx.in.cellTemp - 25); // L1: temperature
    if (ctx.fidelity >= 2) p *= 1 - ctx.params.soiling; // L2: dust / soiling
    ctx.out.power = Math.max(0, p);
  },
  keyFigures: (ctx) => [
    ['Irradiance', ctx.in.irradiance, 'W/m²'],
    ['Output', ctx.out.power, 'W'],
  ],
});
