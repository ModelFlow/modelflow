import {
  defineModel,
  outPort,
  param,
  type AllocationPolicy,
  type BusRequest,
  type ModelDef,
  type ReserveView,
} from '@modelflow/core';

/**
 * Priority pro-rata allocation. Requests are served band-by-band (band 0 first,
 * so band 0 sheds LAST); within a band, if supply is short it is split
 * pro-rata by demand. Deterministic and order-stable.
 */
export function priorityProRata(): AllocationPolicy {
  let buf = new Float64Array(0);
  return {
    allocate(supply: number, requests: readonly BusRequest[], _reserve: ReserveView | null, _dt: number): Float64Array {
      const n = requests.length;
      if (buf.length !== n) buf = new Float64Array(n);
      buf.fill(0);
      const idx = [...requests.keys()].sort((a, b) => requests[a].band - requests[b].band);
      let remaining = supply;
      let i = 0;
      while (i < idx.length) {
        const band = requests[idx[i]].band;
        let groupDemand = 0;
        let j = i;
        while (j < idx.length && requests[idx[j]].band === band) {
          groupDemand += Math.max(0, requests[idx[j]].amount);
          j++;
        }
        const frac = groupDemand > 0 ? Math.min(1, Math.max(0, remaining) / groupDemand) : 0;
        for (let k = i; k < j; k++) buf[idx[k]] = requests[idx[k]].amount > 0 ? frac : 0;
        remaining -= frac * groupDemand;
        i = j;
      }
      return buf;
    },
  };
}

/** Create a bus owner for a commodity within its subtree. */
export function arbitratedBus(commodity: string, policy: AllocationPolicy = priorityProRata()): ModelDef {
  return defineModel({
    type: `Bus:${commodity}`,
    providesBus: commodity,
    policy,
    state: () => ({}),
    step() {
      /* arbitration is handled by the engine's bus phase */
    },
  });
}

/** A model that offers a fixed supply of `commodity` to its nearest bus. */
export function busSource(commodity: string): ModelDef {
  return defineModel({
    type: `Source:${commodity}`,
    buses: { p: { commodity, role: 'offer' } },
    params: { supply: param(0, '', 'Supply offered to the bus') },
    state: () => ({}),
    declare(ctx) {
      ctx.bus.p.offer = ctx.params.supply;
    },
    step() {},
  });
}

/**
 * A prioritised load on `commodity`. Sets its demand + band each step and
 * reports the amount actually served on the `served` output port.
 */
export function busLoad(commodity: string): ModelDef {
  return defineModel({
    type: `Load:${commodity}`,
    ports: { served: outPort('') },
    buses: { p: { commodity, role: 'request' } },
    params: {
      demand: param(0, '', 'Amount requested from the bus'),
      band: param(0, '', 'Priority band (0 = highest, sheds last)'),
    },
    state: () => ({}),
    declare(ctx) {
      ctx.bus.p.demand = ctx.params.demand;
      ctx.bus.p.band = ctx.params.band;
    },
    step(ctx) {
      ctx.out.served = ctx.bus.p.served;
    },
    keyFigures: (ctx) => [['Served', ctx.bus.p.served, '']],
  });
}
