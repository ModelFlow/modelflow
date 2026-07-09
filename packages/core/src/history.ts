/**
 * Columnar, step-aligned time-series storage. Growable typed arrays keep the
 * hot path allocation-free (amortised doubling only when a buffer fills). Late
 * series (a signal that first appears mid-run) are leading-zero padded so every
 * column stays the same length — a hard invariant the Recording relies on.
 *
 * The engine stages values through direct {@link TimeSeries} handles (no map
 * lookup per step); only dynamic `emit()` series go through the id map.
 */
export class TimeSeries {
  private buf = new Float64Array(1024);
  count = 0;
  private pendingVal = 0;
  private hasPending = false;

  constructor(
    readonly id: string,
    public name: string,
    readonly unit: string,
  ) {}

  /** Stage this step's value (flushed by History.commitStep). */
  stage(v: number): void {
    this.pendingVal = v;
    this.hasPending = true;
  }

  /** Append the staged value, or repeat the latest if nothing was staged. */
  flush(): void {
    this.append(this.hasPending ? this.pendingVal : this.latest);
    this.hasPending = false;
  }

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

  toArray(): number[] {
    return Array.from(this.buf.subarray(0, this.count));
  }
}

export class History {
  readonly all: TimeSeries[] = [];
  private readonly byId = new Map<string, TimeSeries>();
  /** Number of committed steps. */
  steps = 0;

  /** Get-or-create a series, leading-zero padded to the current step count. */
  ensure(id: string, name: string, unit: string): TimeSeries {
    let s = this.byId.get(id);
    if (!s) {
      s = new TimeSeries(id, name, unit);
      for (let i = 0; i < this.steps; i++) s.append(0);
      this.byId.set(id, s);
      this.all.push(s);
    }
    return s;
  }

  /** Stage a value for a (possibly new) series — used by dynamic `emit()`. */
  record(id: string, name: string, unit: string, value: number): void {
    this.ensure(id, name, unit).stage(value);
  }

  /** Flush every series' staged value (unwritten series repeat their latest). */
  commitStep(): void {
    for (const s of this.all) s.flush();
    this.steps++;
  }

  series(id: string): TimeSeries | undefined {
    return this.byId.get(id);
  }
}
