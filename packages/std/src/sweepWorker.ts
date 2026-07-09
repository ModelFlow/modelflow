/**
 * Worker entry for {@link runSweep}. Receives a module URL + a slice of cases,
 * imports the sweep target itself, runs each case compute-only, and posts back
 * the metrics tagged with their original index.
 */
import { runCase, type SweepTarget } from './sweep';

declare const self: {
  onmessage: ((ev: MessageEvent) => void) | null;
  postMessage(data: unknown): void;
};

self.onmessage = async (ev: MessageEvent) => {
  const { module, items } = ev.data as { module: string; items: { i: number; c: unknown }[] };
  const target = ((await import(module)) as { default: SweepTarget }).default;
  const out = items.map(({ i, c }) => ({ i, m: runCase(target, c) }));
  self.postMessage(out);
};
