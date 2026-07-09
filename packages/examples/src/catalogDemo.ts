import { modelSpec } from '@modelflow/core';
import { SolarPanel } from './solarPanel';

/** Print the SolarPanel's publishable component spec — `bun run catalogDemo`. */
const spec = modelSpec(SolarPanel);

console.log(`# ${spec.type} — ${spec.description}\n`);
console.log('PORTS');
for (const p of spec.ports) {
  console.log(`  ${p.dir === 'in' ? '→' : '←'} ${p.name.padEnd(12)} ${p.unit.padEnd(8)} [${p.dimension}]${p.desc ? '  — ' + p.desc : ''}`);
}
console.log('\nPARAMS');
for (const p of spec.params) {
  console.log(`  • ${p.name.padEnd(12)} ${String(p.value).padEnd(8)} ${p.unit.padEnd(8)} [${p.dimension}]${p.source ? '  src: ' + p.source : ''}`);
}
console.log('\nJSON (what the website would publish):');
console.log(JSON.stringify(spec, null, 2));
