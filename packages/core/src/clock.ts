/**
 * A minimal, domain-free simulation clock: a fixed timestep counter with an
 * epoch so a domain can map sim time onto a calendar. Domains (Mars sols,
 * lunar days) layer their own season/day math on top of `t` in seconds.
 */
export class SimClock {
  step = 0;
  /** Elapsed simulation seconds. */
  t = 0;

  constructor(
    readonly epochMs: number,
    readonly dt: number,
  ) {}

  advance(): void {
    this.step++;
    this.t += this.dt;
  }

  /** Wall-clock Date corresponding to the current sim time. */
  get date(): Date {
    return new Date(this.epochMs + this.t * 1000);
  }

  reset(): void {
    this.step = 0;
    this.t = 0;
  }
}
