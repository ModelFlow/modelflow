/**
 * Columnar, step-aligned time-series storage. Growable typed arrays keep the
 * hot path allocation-free (amortised doubling only when a buffer fills). Late
 * series (a signal that first appears mid-run) are leading-zero padded so every
 * column stays the same length — a hard invariant the Recording relies on.
 */
export class TimeSeries {
  private buf = new Float64Array(1024);
  count = 0;

  constructor(
    readonly id: string,
    public name: string,
    readonly unit: string,
  ) {}

  append(v: number): void {
    if (this.count === this.buf.length) {
      const next = new Float64Array(this.buf.length * 2);
      next.set(this.buf);
      this.buf = next;
    }
    this.buf[this.count++] = v;
  }

  get latest(): number {
    return this.count ? this.buf[this.count - 1] : 0;
  }

  /** A right-sized copy of the recorded values. */
  toArray(): number[] {
    return Array.from(this.buf.subarray(0, this.count));
  }
}

export class History {
  readonly all: TimeSeries[] = [];
  private readonly byId = new Map<string, TimeSeries>();
  private readonly pending = new Map<string, number>();
  /** Number of committed steps. */
  steps = 0;

  /** Register (if new) and stage a value for this step. */
  record(id: string, name: string, unit: string, value: number): void {
    let s = this.byId.get(id);
    if (!s) {
      s = new TimeSeries(id, name, unit);
      // Leading-zero pad so this column aligns with already-committed steps.
      for (let i = 0; i < this.steps; i++) s.append(0);
      this.byId.set(id, s);
      this.all.push(s);
    }
    this.pending.set(id, value);
  }

  /** Flush staged values; unwritten series repeat their latest value. */
  commitStep(): void {
    for (const s of this.all) {
      const p = this.pending.get(s.id);
      s.append(p !== undefined ? p : s.latest);
    }
    this.pending.clear();
    this.steps++;
  }

  series(id: string): TimeSeries | undefined {
    return this.byId.get(id);
  }
}
