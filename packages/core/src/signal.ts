import type { Unit, NetId } from './types';

/**
 * A port is a named, typed, directional connection point on a model. Output
 * ports drive a net; input ports read one. Ports are the point-to-point
 * (single wire) half of ModelFlow's wiring — the other half is buses.
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
 * A net is one resolved signal shared by one or more ports. Every net has a
 * single driver and is one slot in the engine's Float64Array.
 */
export interface Net {
  readonly id: NetId;
  /** Series id in the Recording (e.g. "tank.level", "sv_isru"). */
  readonly name: string;
  readonly unit: Unit;
  readonly flow: boolean;
}

/**
 * One directional sub-signal inside a group channel, from the HUB's point of
 * view. `in` = the hub reads it (each member drives its own per-member net);
 * `out` = the hub writes it (the hub drives each member's per-member net).
 */
export interface ChannelField {
  readonly dir: 'in' | 'out';
  readonly unit: Unit;
  readonly default?: number;
}

/**
 * A dynamic-arity port: an ordered array of identical channels, one per joined
 * member. This is what makes a bus "a model like any other" — the hub declares
 * a group port and loops over its members in `resolve`. No engine privilege.
 */
export interface GroupPortDecl {
  readonly kind: 'group';
  readonly channel: Record<string, ChannelField>;
  /** Per-connection static scalars the scenario sets (band, tag…), with defaults. */
  readonly meta?: Record<string, number>;
  readonly desc?: string;
}

export function groupPort(spec: Omit<GroupPortDecl, 'kind'>): GroupPortDecl {
  return { kind: 'group', ...spec };
}

export type AnyPort = PortDecl | GroupPortDecl;
export const isGroupPort = (p: AnyPort): p is GroupPortDecl => (p as GroupPortDecl).kind === 'group';
