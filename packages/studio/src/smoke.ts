import { Engine } from '@modelflow/core';
import { microgrid, microgridRegistry } from './demo';

const e = new Engine(microgrid.timestepSeconds, 0, microgrid.seed);
e.build(microgrid, microgridRegistry);
for (let i = 0; i < 200; i++) e.step(); // ~8 days at 1h steps → land near a noon

const s = e.structure();
console.log(`structure: ${s.nodes.length} nodes, ${s.edges.length} edges`);
console.log('signal edges (unit-labelled):');
for (const x of s.edges.filter((x) => x.kind === 'signal'))
  console.log(`  ${x.source}.${x.sourcePort} → ${x.target}.${x.targetPort}  [${x.unit || '·'}]`);
console.log(`group edges: ${s.edges.filter((x) => x.kind === 'group').length}`);

console.log('\ninstance key figures:');
for (const v of e.instanceViews())
  console.log(`  ${v.key.padEnd(14)} ${v.type.padEnd(16)} ${v.keyFigures.map((f) => `${f[0]}=${f[1].toFixed(1)}${f[2]}`).join('  ')}`);

console.log('\nbus:', 'offered', e.history.series('bus.power.offered')?.latest.toFixed(2),
  'served', e.history.series('bus.power.served')?.latest.toFixed(2),
  'unmet', e.history.series('bus.power.unmet')?.latest.toFixed(2), 'kW');
