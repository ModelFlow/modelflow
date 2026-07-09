import { Engine, type Scenario, type ModelRegistry } from '@modelflow/core';

/**
 * A sweep target describes one family of runs: how to build the registry, how
 * to turn a case's parameters into a scenario, and what small metric object to
 * extract from the finished engine. Runs use `record: false` (compute-only),
 * so metrics come from `engine.netValue(...)` / `aggregate` / `find`.
 */
export interface SweepTarget<C = unknown, M = unknown> {
  registry: ModelRegistry;
  scenario(caseParams: C): Scenario;
  metrics(engine: Engine): M;
}

/** Run one case to completion (no recording) and extract its metrics. */
export function runCase<C, M>(target: SweepTarget<C, M>, caseParams: C): M {
  const scn = target.scenario(caseParams);
  const eng = new Engine(scn.timestepSeconds, scn.epochMs ?? 0, scn.seed, { record: false });
  eng.build(scn, target.registry);
  eng.run();
  return target.metrics(eng);
}

/** Single-threaded sweep. */
export function runSweepInline<C, M>(target: SweepTarget<C, M>, cases: C[]): M[] {
  const out = new Array<M>(cases.length);
  for (let i = 0; i < cases.length; i++) out[i] = runCase(target, cases[i]);
  return out;
}

/**
 * Parallel sweep across Web Workers. `module` is a URL/path to a module whose
 * default export is a {@link SweepTarget} — workers import it themselves (you
 * can't ship functions across the worker boundary). Results preserve case order.
 * Works in Bun and the browser (same Worker API).
 */
export async function runSweep<C, M>(opts: {
  module: string;
  cases: C[];
  workers?: number;
}): Promise<M[]> {
  const workers = Math.max(1, opts.workers ?? 1);
  if (workers <= 1) {
    const target = ((await import(opts.module)) as { default: SweepTarget<C, M> }).default;
    return runSweepInline(target, opts.cases);
  }

  const results = new Array<M>(opts.cases.length);
  const buckets: { i: number; c: C }[][] = Array.from({ length: workers }, () => []);
  opts.cases.forEach((c, i) => buckets[i % workers].push({ i, c }));

  await Promise.all(
    buckets.map(
      (items) =>
        new Promise<void>((resolve, reject) => {
          if (items.length === 0) return resolve();
          const w = new Worker(new URL('./sweepWorker.ts', import.meta.url), { type: 'module' });
          w.addEventListener('message', (ev: MessageEvent) => {
            for (const { i, m } of ev.data as { i: number; m: M }[]) results[i] = m;
            w.terminate();
            resolve();
          });
          w.addEventListener('error', (ev: ErrorEvent) => {
            w.terminate();
            reject(ev.message ?? ev);
          });
          w.postMessage({ module: opts.module, items });
        }),
    ),
  );
  return results;
}
