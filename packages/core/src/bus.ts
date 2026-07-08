/**
 * Resource buses — the many-to-many half of ModelFlow's wiring.
 *
 * A bus carries one commodity (power, labor, …). Models `offer` supply,
 * `request` demand (with a priority `band`), or `read` an attached reserve
 * store. Each step the engine sums offers, collects requests, and asks a
 * pluggable {@link AllocationPolicy} how much of each request to grant. This
 * one primitive replaces bespoke power buses, labor pools, etc.
 */

export interface BusAttach {
  /** Commodity id; resolves to the NEAREST-OWNER bus for this id up the tree. */
  readonly commodity: string;
  readonly role: 'offer' | 'request' | 'read';
  /** Priority for `request` (0 = highest priority, sheds last). */
  readonly band?: number;
  /** Free-form label (task type / load class), surfaced in diagnostics. */
  readonly tag?: string;
}

/** A single demand submitted to a bus in the declare phase. */
export interface BusRequest {
  amount: number;
  band: number;
  tag: string;
}

/**
 * A reserve store (e.g. a battery) attached to a bus, as seen by a policy.
 * `dt` is always passed explicitly — policies must never reach for wall time.
 */
export interface ReserveView {
  readonly level: number;
  readonly capacity: number;
  /** Max amount that can be withdrawn this step. */
  maxDischarge(dt: number): number;
  /** Amount withdrawable this step while staying at or above a SoC fraction. */
  aboveSoc(soc: number, dt: number): number;
}

/**
 * Decides how a bus splits limited supply across prioritised requests.
 * Must be deterministic and order-stable. Returns granted FRACTION [0..1] per
 * request, index-aligned with `requests`.
 */
export interface AllocationPolicy {
  allocate(
    supply: number,
    requests: readonly BusRequest[],
    reserve: ReserveView | null,
    dt: number,
  ): Float64Array;
}

/**
 * Live handle a model uses to talk to its nearest bus. Zero-allocation: the
 * fields are written/read directly against the compiled bus's accumulators.
 */
export interface BusHandle {
  /** (offer role) set the supply this instance contributes this step. */
  offer: number;
  /** (request role) set the demand this instance needs this step. */
  demand: number;
  /** (request role) priority band; defaults to the attachment's, settable each step. */
  band: number;
  /** (request role) fraction 0..1 of `demand` granted — valid after resolve. */
  readonly granted: number;
  /** (request role) the amount actually granted this step (demand × granted). */
  readonly served: number;
  /** (read role) level of the bus's attached reserve store. */
  readonly level: number;
}
