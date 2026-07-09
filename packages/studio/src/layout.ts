import type { GraphNode, GraphEdge } from '@modelflow/core';

/**
 * Cheap layered ("Sugiyama-lite") layout: longest-path layering left→right,
 * stacked vertically within each layer. No dependency; good enough for the
 * generic connection graph. Cycles are bounded by iteration count.
 */
export function layeredLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, { x: number; y: number }> {
  const layer = new Map<string, number>();
  for (const n of nodes) layer.set(n.key, 0);
  for (let iter = 0; iter < nodes.length; iter++) {
    let changed = false;
    for (const e of edges) {
      const next = (layer.get(e.source) ?? 0) + 1;
      if (next > (layer.get(e.target) ?? 0)) {
        layer.set(e.target, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const byLayer = new Map<number, string[]>();
  for (const n of nodes) {
    const l = layer.get(n.key) ?? 0;
    const arr = byLayer.get(l) ?? [];
    arr.push(n.key);
    byLayer.set(l, arr);
  }
  const pos = new Map<string, { x: number; y: number }>();
  for (const [l, keys] of byLayer) {
    keys.forEach((k, i) => pos.set(k, { x: l * 230, y: i * 96 }));
  }
  return pos;
}
