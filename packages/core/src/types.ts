/**
 * Fundamental scalar types shared across the ModelFlow core.
 *
 * Everything the engine wires together is a `number` living in one flat
 * Float64Array (a "net"). Units are validated strings, not types, so a domain
 * can invent any unit it likes ('kW', 'kg/s', 'mmHg', 'widgets/day').
 */

/** A physical unit, validated as a string (empty string = dimensionless). */
export type Unit = string;

/** Index of a signal slot in the engine's Float64Array signal pool. */
export type NetId = number;

/**
 * Fidelity tier a model runs at.
 *  - 0 = L0 distilled: a single averaged number (fastest)
 *  - 1 = L1 analytic:  a daily / seasonal formula (default)
 *  - 2 = L2 physics:   resolved sub-step detail (most detailed)
 */
export type Fidelity = 0 | 1 | 2;

/** Health of a model instance, surfaced to the viewer. */
export type Health = 'nominal' | 'degraded' | 'failed' | 'offline';

/** Log severity for `ctx.log`. */
export type Severity = 'info' | 'warn' | 'error';
