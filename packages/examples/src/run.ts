import { Engine } from '@modelflow/core';
import { tankLoop, tankLoopRegistry } from './tankLoop';

/** Run the tank-loop and print the level trajectory — `bun run example:tank`. */
const eng = new Engine(tankLoop.timestepSeconds, 0, tankLoop.seed);
eng.build(tankLoop, tankLoopRegistry);
eng.run();

const level = eng.history.series('lvl')!;
const vals = level.toArray();
console.log(`tank-loop: ${vals.length} steps recorded`);
console.log(`  initial level: ${vals[0].toFixed(1)} kg`);
console.log(`  final level:   ${vals[vals.length - 1].toFixed(1)} kg`);
const tail = vals.slice(-2000);
console.log(`  settled range: [${Math.min(...tail).toFixed(1)}, ${Math.max(...tail).toFixed(1)}] kg`);
