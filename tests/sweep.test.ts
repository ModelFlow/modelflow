import { test, expect } from 'bun:test';
import { runSweepInline, runCase } from '@modelflow/std';
import target from '../packages/examples/src/tankSweepTarget';

test('compute-only sweep produces varied, plausible results', () => {
  const cases = [{ drain: 1 }, { drain: 2 }, { drain: 3 }, { drain: 4 }];
  const out = runSweepInline(target, cases);
  expect(out.length).toBe(4);
  for (const m of out) {
    expect(Number.isFinite(m.level0)).toBe(true);
    // Controller holds the tank near 500 unless drain outruns the 5 kg/s source.
    expect(m.level0).toBeGreaterThanOrEqual(0);
    expect(m.level0).toBeLessThanOrEqual(1000);
  }
  // Different drains must produce different settled levels (real varied work).
  expect(out[0].level0).not.toBeCloseTo(out[3].level0, 1);
});

test('record:false runs are deterministic', () => {
  const a = runCase(target, { drain: 2.5 });
  const b = runCase(target, { drain: 2.5 });
  expect(a.level0).toBe(b.level0);
  expect(a.served0).toBe(b.served0);
});
