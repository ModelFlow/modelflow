import { defineModel, inPort, outPort, param } from '@modelflow/core';

/**
 * A publishable component: a photovoltaic panel. Takes plane-of-array
 * irradiance (W/m²) and a cell temperature (°C), outputs electrical power (W).
 * Every interface point is unit-annotated, so this drops into any simulation —
 * ModelFlow converts W↔kW, °C↔K, W/m²↔kW/m² automatically at the wire.
 */
export const SolarPanel = defineModel({
  type: 'SolarPanel',
  description: 'Photovoltaic array: irradiance + cell temperature → DC power.',
  ports: {
    irradiance: inPort('W/m^2', { desc: 'Plane-of-array solar irradiance' }),
    cellTemp: inPort('°C', { default: 25, desc: 'Cell temperature' }),
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
    tempCoeff: param(-0.0035, '1/K', 'Power temperature coefficient', {
      max: 0,
      source: 'Typical triple-junction III-V cell',
      notes: 'Fractional power loss per kelvin above the 25 °C reference temperature.',
    }),
  },
  state: () => ({}),
  step(ctx) {
    // Derate linearly from the 25 °C reference cell temperature.
    const derate = 1 + ctx.params.tempCoeff * (ctx.in.cellTemp - 25);
    ctx.out.power = Math.max(0, ctx.in.irradiance * ctx.params.area * ctx.params.efficiency * derate);
  },
  keyFigures: (ctx) => [
    ['Irradiance', ctx.in.irradiance, 'W/m²'],
    ['Output', ctx.out.power, 'W'],
  ],
});
