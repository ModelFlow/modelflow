#!/usr/bin/env bun
/**
 * ModelFlow MCP server.
 *
 * Exposes the ModelFlow library — a cited database of real-world objects and the
 * behavioural models they map onto — as Model Context Protocol tools, so an
 * agent can look up trustworthy, unit-tagged, sourced parameters for the things
 * it wants to simulate instead of scraping datasheets.
 *
 * Transport: stdio. Run with `bun run packages/mcp/src/server.ts` (or via the
 * `modelflow-mcp` bin). Only the MCP protocol may touch stdout — all logging
 * goes to stderr.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { modelSpec, type ModelDef, type ModelSpec } from '@modelflow/core';
import {
  objects,
  objectById,
  objectCategories,
  searchObjects,
  Constant,
  Source,
  Sink,
  Controller,
  Storage,
  SolarPanel,
  Inverter,
  arbitratedBus,
  busSource,
  busLoad,
} from '@modelflow/std';

// --- the model library the server can describe -----------------------------
const MODELS: ModelDef[] = [
  SolarPanel,
  Inverter,
  Storage,
  Source,
  Sink,
  Controller,
  Constant,
  arbitratedBus('power'),
  busSource('power'),
  busLoad('power'),
];
const modelSpecs = new Map<string, ModelSpec>();
for (const m of MODELS) modelSpecs.set(m.type, modelSpec(m));

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
const err = (message: string) => ({ isError: true, content: [{ type: 'text' as const, text: message }] });

const compactObject = (o: (typeof objects)[number]) => ({
  id: o.id,
  name: o.name,
  category: o.category,
  maker: o.maker,
  model: o.model,
  summary: o.summary,
  paramCount: o.params.length,
  tags: o.tags,
});

const compactModel = (s: ModelSpec) => ({
  type: s.type,
  description: s.description,
  ports: s.ports.map((p) => ({ name: p.name, dir: p.dir, unit: p.unit, dimension: p.dimension })),
  params: s.params.map((p) => p.name),
  groupPorts: s.groupPorts.map((g) => g.name),
});

const server = new McpServer({ name: 'modelflow', version: '0.0.0' });

server.registerTool(
  'list_categories',
  {
    title: 'List library categories',
    description:
      'Overview of the ModelFlow library: the object categories (with counts) and the behavioural model types available. Call this first to see what the library covers.',
    inputSchema: {},
  },
  async () => {
    const cats = objectCategories().map((c) => ({
      category: c,
      count: objects.filter((o) => o.category === c).length,
    }));
    return json({
      objectCount: objects.length,
      categories: cats,
      modelTypes: [...modelSpecs.keys()],
    });
  },
);

server.registerTool(
  'search_objects',
  {
    title: 'Search real-world objects',
    description:
      'Find real-world objects in the library by free-text query and/or category. Matches id, name, maker, summary, tags and parameter labels. Returns a compact list; call get_object for the full cited parameter set. Omit both arguments to list everything.',
    inputSchema: {
      query: z.string().optional().describe('Free-text query, e.g. "home battery", "rocket engine", "solar".'),
      category: z.string().optional().describe('Restrict to a category, e.g. "Energy storage" (case-insensitive).'),
    },
  },
  async ({ query, category }) => {
    let results = query ? searchObjects(query) : [...objects];
    if (category) {
      const c = category.trim().toLowerCase();
      results = results.filter((o) => o.category.toLowerCase().includes(c));
    }
    return json({ count: results.length, objects: results.map(compactObject) });
  },
);

server.registerTool(
  'get_object',
  {
    title: 'Get a real-world object',
    description:
      'Full record for one object: every parameter with its value, unit, source citation and link, plus which model param it maps to (mapsTo). Use this to pull trustworthy numbers for a simulation.',
    inputSchema: {
      id: z.string().describe('Object id, e.g. "tesla-powerwall-3" (from search_objects).'),
    },
  },
  async ({ id }) => {
    const o = objectById(id);
    if (!o) return err(`No object with id "${id}". Known ids: ${objects.map((x) => x.id).join(', ')}.`);
    return json(o);
  },
);

server.registerTool(
  'list_models',
  {
    title: 'List behavioural models',
    description:
      'The behavioural model types objects can map onto (via an object\'s "model" field). Each entry lists ports (with units) and parameter names. Call get_model for a type\'s full spec.',
    inputSchema: {},
  },
  async () => json({ count: modelSpecs.size, models: [...modelSpecs.values()].map(compactModel) }),
);

server.registerTool(
  'get_model',
  {
    title: 'Get a behavioural model spec',
    description:
      'Full specification for one model type: ports, dimensions, parameter defaults with provenance, group ports, and its step logic as source. Objects whose "model" is this type can seed it directly.',
    inputSchema: {
      type: z.string().describe('Model type, e.g. "Storage", "SolarPanel", "Bus:power" (from list_models).'),
    },
  },
  async ({ type }) => {
    const spec = modelSpecs.get(type);
    if (!spec) return err(`No model type "${type}". Known types: ${[...modelSpecs.keys()].join(', ')}.`);
    return json(spec);
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[modelflow-mcp] ready — ${objects.length} objects, ${modelSpecs.size} models, ${5} tools over stdio`,
  );
}

main().catch((e) => {
  console.error('[modelflow-mcp] fatal:', e);
  process.exit(1);
});
