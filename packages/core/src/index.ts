/**
 * @modelflow/core — a generic, hierarchical, composable simulation engine.
 * Zero domain knowledge: no Mars, no "sol", no baked-in resource names.
 */
export type { Unit, NetId, Fidelity, Health, Severity } from './types';
export {
  parseUnit,
  convert,
  conversion,
  unitsCompatible,
  describeDimension,
  dimEqual,
  UnitError,
  DIM_NAMES,
  type Dimension,
  type ResolvedUnit,
} from './units';
export type { PortDecl, Net } from './signal';
export { inPort, outPort } from './signal';
export type { ParamSpec } from './param';
export { param } from './param';
export type { CommoditySpec } from './commodity';
export { CommodityRegistry } from './commodity';
export type { BusAttach, BusRequest, ReserveView, AllocationPolicy, BusHandle } from './bus';
export type { KeyFigure, ParamValues, ModelInstanceView, StepCtx, ModelDef } from './model';
export { defineModel, validateModelDef } from './model';
export type { InstanceSpec, Scenario } from './scenario';
export { ModelRegistry, registry } from './registry';
export type { Rng } from './rng';
export { makeRng, hashSeed } from './rng';
export { SimClock } from './clock';
export { TimeSeries, History } from './history';
export {
  ModelFlowError,
  AggregateValidationError,
  editDistance,
  suggest,
  type ValidationIssue,
} from './validate';
export { Engine, type LogEntry } from './engine';
export type {
  Recording,
  RecFrame,
  RecModuleState,
  RecEnv,
  RecShip,
  RecScene,
} from './recording';
export { round4 } from './recording';
export {
  modelSpec,
  catalog,
  type ModelSpec,
  type PortSpec,
  type ParamPublicSpec,
  type BusSpec,
} from './catalog';
