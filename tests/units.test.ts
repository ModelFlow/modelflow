import { test, expect } from 'bun:test';
import { convert, unitsCompatible, conversion, parseUnit, describeDimension, UnitError } from '@modelflow/core';

test('SI prefixes convert', () => {
  expect(convert(1, 'kW', 'W')).toBeCloseTo(1000, 6);
  expect(convert(2500, 'W', 'kW')).toBeCloseTo(2.5, 6);
  expect(convert(1, 'MW', 'kW')).toBeCloseTo(1000, 6);
  expect(convert(1, 'g', 'kg')).toBeCloseTo(0.001, 9);
  expect(convert(1, 't', 'kg')).toBeCloseTo(1000, 6);
});

test('compound units convert', () => {
  // 1 kg/s = 86400 kg/day = 86.4 t/day
  expect(convert(1, 'kg/s', 't/day')).toBeCloseTo(86.4, 4);
  // 1 kWh = 3.6 MJ
  expect(convert(1, 'kWh', 'MJ')).toBeCloseTo(3.6, 6);
  // W/m^2 dimension is power density
  expect(describeDimension(parseUnit('W/m^2').dim)).toBe('power density');
  // pressure aliases
  expect(convert(1, 'bar', 'kPa')).toBeCloseTo(100, 6);
  expect(convert(760, 'mmHg', 'atm')).toBeCloseTo(1, 3);
});

test('affine temperature converts', () => {
  expect(convert(0, '°C', 'K')).toBeCloseTo(273.15, 6);
  expect(convert(100, '°C', 'K')).toBeCloseTo(373.15, 6);
  expect(convert(32, '°F', '°C')).toBeCloseTo(0, 6);
  expect(convert(212, '°F', 'K')).toBeCloseTo(373.15, 6);
});

test('dimensional compatibility', () => {
  expect(unitsCompatible('kW', 'W')).toBe(true);
  expect(unitsCompatible('kg/s', 't/day')).toBe(true);
  expect(unitsCompatible('W', 'kg/s')).toBe(false);
  expect(unitsCompatible('J', 'W')).toBe(false); // energy vs power
});

test('incompatible conversion throws with a clear message', () => {
  let err: unknown;
  try {
    conversion('W', 'kg/s');
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(UnitError);
  expect(String(err)).toContain('power');
  expect(String(err)).toContain('mass flow');
});

test('named dimensions', () => {
  expect(describeDimension(parseUnit('W').dim)).toBe('power');
  expect(describeDimension(parseUnit('J').dim)).toBe('energy');
  expect(describeDimension(parseUnit('Pa').dim)).toBe('pressure');
  expect(describeDimension(parseUnit('kg/s').dim)).toBe('mass flow');
  expect(describeDimension(parseUnit('USD').dim)).toBe('currency');
});
