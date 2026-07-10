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
export type { PortDecl, Net, ChannelField, GroupPortDecl, AnyPort } from './signal';
export { inPort, outPort, groupPort, isGroupPort } from './signal';
export type { ParamSpec, ParamSource } from './param';
export { param } from './param';
export type { CommoditySpec } from './commodity';
export { CommodityRegistry } from './commodity';
export type { KeyFigure, ParamValues, ModelInstanceView, StepCtx, ModelDef, Channel } from './model';
export { defineModel, validateModelDef } from './model';
export type { InstanceSpec, JoinSpec, Scenario } from './scenario';
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
export {
  Engine,
  type LogEntry,
  type EngineOptions,
  type GraphNode,
  type GraphEdge,
  type InstanceView,
} from './engine';
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
  type GroupPortSpec,
  type ParamPublicSpec,
} from './catalog';
