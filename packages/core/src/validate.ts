/**
 * Validation & error reporting. The whole point is *agent-friendliness*: every
 * error names the offending path, lists the legal alternatives, and suggests a
 * fix, so an LLM (or human) can one-shot the correction.
 */

/** A single problem found while building a scenario. */
export interface ValidationIssue {
  /** JSON-ish path, e.g. `instances[4].type`. */
  path: string;
  message: string;
  /** Optional concrete fix hint. */
  fix?: string;
}

/** Thrown for author-time model definition mistakes (bad ports, etc.). */
export class ModelFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelFlowError';
  }
}

/** Thrown by `Engine.build` — carries *all* scenario problems at once. */
export class AggregateValidationError extends Error {
  constructor(
    readonly scenarioName: string,
    readonly issues: ValidationIssue[],
  ) {
    super(
      `Scenario "${scenarioName}" is invalid (${issues.length} problem${issues.length === 1 ? '' : 's'}):\n` +
        issues.map((i) => `  • ${i.path}: ${i.message}${i.fix ? `\n      → ${i.fix}` : ''}`).join('\n'),
    );
    this.name = 'AggregateValidationError';
  }
}

/** Levenshtein edit distance (small strings). */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let cur = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

/** Closest candidate to `target` within an edit-distance threshold, else null. */
export function suggest(target: string, candidates: Iterable<string>): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const d = editDistance(target.toLowerCase(), c.toLowerCase());
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  const threshold = Math.max(2, Math.floor(target.length / 3));
  return best !== null && bestD <= threshold ? best : null;
}
