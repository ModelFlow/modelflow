import { catalog, registry, type ModelSpec } from '@modelflow/core';
import { Source, Sink, Constant, Controller, Storage, arbitratedBus, busSource, busLoad } from '@modelflow/std';
import { SolarPanel } from '../../examples/src/solarPanel';
import { DiurnalIrradiance, Inverter } from './demoModels';

/** The seed library — the standard primitives plus the demo's domain models. */
export const libraryRegistry = registry(
  SolarPanel,
  DiurnalIrradiance,
  Inverter,
  Source,
  Sink,
  Constant,
  Controller,
  Storage,
  arbitratedBus('power'),
  busSource('power'),
  busLoad('power'),
);

export function seedModels(): ModelSpec[] {
  return catalog(libraryRegistry);
}

const KEY = 'modelflow.library.published.v1';

export function loadPublished(): ModelSpec[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as ModelSpec[];
  } catch {
    return [];
  }
}

export function publishModel(spec: ModelSpec): void {
  const next = [...loadPublished().filter((m) => m.type !== spec.type), spec];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export function unpublishModel(type: string): void {
  const next = loadPublished().filter((m) => m.type !== type);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
