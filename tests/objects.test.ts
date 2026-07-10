import { test, expect } from 'bun:test';
import { modelSpec, type ModelDef } from '@modelflow/core';
import {
  objects,
  objectById,
  objectCategories,
  searchObjects,
  SolarPanel,
  Inverter,
  Storage,
  Source,
  Sink,
  Controller,
  Constant,
} from '@modelflow/std';

// The model param names an object's `mapsTo` is allowed to reference.
const MODEL_PARAMS = new Map<string, Set<string>>(
  ([SolarPanel, Inverter, Storage, Source, Sink, Controller, Constant] as ModelDef[]).map((m) => [
    m.type,
    new Set(modelSpec(m).params.map((p) => p.name)),
  ]),
);

test('object ids are unique and non-empty', () => {
  const ids = objects.map((o) => o.id);
  expect(ids.every((id) => id.length > 0)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
});

test('every object has a category, summary and at least one parameter', () => {
  for (const o of objects) {
    expect(o.category.length).toBeGreaterThan(0);
    expect(o.summary.length).toBeGreaterThan(0);
    expect(o.params.length).toBeGreaterThan(0);
  }
});

test('every parameter is labelled, valued and sourced', () => {
  for (const o of objects) {
    for (const p of o.params) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.value === undefined || p.value === null).toBe(false);
      // a real object database earns trust from citations — require one.
      expect(Boolean(p.source || p.url)).toBe(true);
    }
  }
});

test('object.model and param.mapsTo reference real models and their params', () => {
  for (const o of objects) {
    if (!o.model) continue;
    const params = MODEL_PARAMS.get(o.model);
    expect(params, `object "${o.id}" maps to unknown model "${o.model}"`).toBeDefined();
    for (const p of o.params) {
      if (p.mapsTo) {
        expect(params!.has(p.mapsTo), `"${o.id}".${p.mapsTo} is not a param of ${o.model}`).toBe(true);
      }
    }
  }
});

test('search tokenises multi-word queries (AND) and is case-insensitive', () => {
  const battery = searchObjects('home battery').map((o) => o.id);
  expect(battery).toContain('tesla-powerwall-3');
  expect(battery).toContain('tesla-powerwall-2');

  const rockets = searchObjects('ROCKET').map((o) => o.id);
  expect(rockets).toContain('spacex-raptor-2');
  expect(rockets).toContain('spacex-starship-ship-v2');
  expect(rockets).toContain('spacex-super-heavy');

  expect(searchObjects('').length).toBe(objects.length);
});

test('objectById and objectCategories are consistent', () => {
  expect(objectById('tesla-powerwall-3')?.name).toBe('Tesla Powerwall 3');
  expect(objectById('nope')).toBeUndefined();
  const cats = objectCategories();
  expect(new Set(cats).size).toBe(cats.length);
  for (const o of objects) expect(cats).toContain(o.category);
});
