/** Spawns the server over stdio and exercises every tool. Run from repo root. */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: 'bun', args: ['run', 'packages/mcp/src/server.ts'] });
const client = new Client({ name: 'smoke', version: '0' });
await client.connect(transport);

const text = (r: any) => r.content?.[0]?.text ?? '';

const tools = await client.listTools();
console.log('TOOLS:', tools.tools.map((t) => t.name).join(', '));

console.log('\nlist_categories →');
console.log(text(await client.callTool({ name: 'list_categories', arguments: {} })));

console.log('\nsearch_objects { query: "home battery" } →');
console.log(text(await client.callTool({ name: 'search_objects', arguments: { query: 'home battery' } })));

console.log('\nsearch_objects { category: "Launch vehicle" } →');
console.log(text(await client.callTool({ name: 'search_objects', arguments: { category: 'Launch vehicle' } })));

console.log('\nget_object { id: "spacex-raptor-2" } →');
console.log(text(await client.callTool({ name: 'get_object', arguments: { id: 'spacex-raptor-2' } })));

console.log('\nget_model { type: "Storage" } → (compact check)');
const m = text(await client.callTool({ name: 'get_model', arguments: { type: 'Storage' } }));
console.log(m.slice(0, 240) + '…');

console.log('\nget_object { id: "does-not-exist" } → (error path)');
const bad = await client.callTool({ name: 'get_object', arguments: { id: 'does-not-exist' } });
console.log('isError:', (bad as any).isError, '|', text(bad).slice(0, 80));

await client.close();
console.log('\n✓ smoke ok');
