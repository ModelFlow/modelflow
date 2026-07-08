import type { Unit, NetId } from './types';

/**
 * A port is a named, typed, directional connection point on a model. Output
 * ports drive a net; input ports read one. Ports are the point-to-point
 * ("Simulink wire") half of ModelFlow's wiring — the other half is buses.
 */
export interface PortDecl {
  readonly dir: 'in' | 'out';
  readonly unit: Unit;
  /** Value read by an unconnected `in` port (default 0). Ignored for `out`. */
  readonly default?: number;
  /** If true, an `in` port must be connected or the scenario is invalid. */
  readonly required?: boolean;
  readonly desc?: string;
}

/** Declare an input port. */
export function inPort(unit: Unit, opts: Omit<Partial<PortDecl>, 'dir' | 'unit'> = {}): PortDecl {
  return { dir: 'in', unit, ...opts };
}

/** Declare an output port. */
export function outPort(unit: Unit, opts: Omit<Partial<PortDecl>, 'dir' | 'unit'> = {}): PortDecl {
  return { dir: 'out', unit, ...opts };
}

/**
 * A net is one resolved signal shared by one or more ports (and/or bus taps).
 * `flow` nets sum all their drivers (a resource bus); plain signal nets have a
 * single driver. Every net is one slot in the engine's Float64Array.
 */
export interface Net {
  readonly id: NetId;
  /** Series id in the Recording (e.g. "tank.level", "bus.power.supplied"). */
  readonly name: string;
  readonly unit: Unit;
  readonly flow: boolean;
}
