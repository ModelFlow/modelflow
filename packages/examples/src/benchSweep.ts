import { runSweepInline, runSweep } from '@modelflow/std';
import target, { instancesPerCase, stepsPerCase } from './tankSweepTarget';

/**
 * Proves the answer to "won't big parameter sweeps be slow in TS?": run a
 * Monte-Carlo-style sweep single-threaded, then across all cores, and report
 * throughput + speedup. This is what a trade study actually does.
 */
const N = 400;
const cases = Array.from({ length: N }, (_, i) => ({ drain: 1 + (i % 40) * 0.05 }));
const modelSteps = N * stepsPerCase * instancesPerCase;

console.log(`sweep: ${N} cases × ${stepsPerCase.toLocaleString()} steps × ${instancesPerCase} instances`);
console.log(`       = ${(modelSteps / 1e6).toFixed(0)}M model-steps total\n`);

// --- single-threaded ---
let t0 = performance.now();
const single = runSweepInline(target, cases);
const tSingle = performance.now() - t0;
console.log(`1 thread:   ${tSingle.toFixed(0).padStart(6)} ms   ${Math.round(modelSteps / (tSingle / 1000) / 1e6)}M model-steps/s`);

// --- all cores ---
const W = Math.max(2, (navigator?.hardwareConcurrency ?? 8));
const moduleUrl = new URL('./tankSweepTarget.ts', import.meta.url).href;
t0 = performance.now();
const parallel = await runSweep<{ drain: number }, { level0: number; served0: number }>({ module: moduleUrl, cases, workers: W });
const tPar = performance.now() - t0;
console.log(`${String(W).padStart(2)} workers: ${tPar.toFixed(0).padStart(6)} ms   ${Math.round(modelSteps / (tPar / 1000) / 1e6)}M model-steps/s   ${(tSingle / tPar).toFixed(1)}× speedup`);

// --- correctness: parallel must match single-threaded exactly ---
let mismatch = 0;
for (let i = 0; i < N; i++) if (Math.abs(single[i].level0 - parallel[i].level0) > 1e-9) mismatch++;
console.log(`\ncorrectness: ${mismatch === 0 ? 'parallel === single-thread ✓' : `${mismatch} MISMATCHES ✗`}`);
console.log(`sample results: drain=${cases[0].drain} → level0=${single[0].level0.toFixed(1)}; drain=${cases[39].drain} → level0=${single[39].level0.toFixed(1)}`);
