import { test, expect } from 'bun:test';
import { modelSpec, catalog, registry } from '@modelflow/core';
import { SolarPanel } from '../packages/examples/src/solarPanel';

test('modelSpec annotates every port with its physical dimension', () => {
  const spec = modelSpec(SolarPanel);
  expect(spec.type).toBe('SolarPanel');
  expect(spec.description).toContain('Photovoltaic');
  const power = spec.ports.find((p) => p.name === 'power')!;
  expect(power.dir).toBe('out');
  expect(power.unit).toBe('W');
  expect(power.dimension).toBe('power');
  const irr = spec.ports.find((p) => p.name === 'irradiance')!;
  expect(irr.dimension).toBe('power density');
  const temp = spec.ports.find((p) => p.name === 'cellTemp')!;
  expect(temp.dimension).toBe('temperature');
});

test('params carry units, dimensions, and provenance', () => {
  const spec = modelSpec(SolarPanel);
  const eff = spec.params.find((p) => p.name === 'efficiency')!;
  expect(eff.dimension).toBe('dimensionless');
  expect(eff.source).toContain('Spectrolab');
  expect(eff.sourceUrl).toContain('spectrolab.com');
  expect(eff.notes).toContain('Beginning-of-life');
  expect(eff.min).toBe(0);
  expect(eff.max).toBe(1);
});

test('catalog describes every registered model', () => {
  const specs = catalog(registry(SolarPanel));
  expect(specs.length).toBe(1);
  expect(specs[0].type).toBe('SolarPanel');
});
