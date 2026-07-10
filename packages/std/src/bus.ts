import { defineModel, groupPort, inPort, outPort, param, type ModelDef } from '@modelflow/core';

/**
 * A commodity bus — now just an ordinary model. It declares two group ports
 * (`sources` and `loads`) and, in `resolve`, loops over whatever is connected:
 * it sums supply, then distributes to loads band-by-band (band 0 served first,
 * so band 0 sheds LAST), splitting pro-rata by demand within a band on
 * shortfall. No engine privilege — this logic is right here, editable, in the
 * Model Library like any other model.
 */
export function arbitratedBus(commodity: string): ModelDef {
  return defineModel({
    type: `Bus:${commodity}`,
    description: `${commodity} bus: sums supply and sheds the lowest-priority band first.`,
    ports: {
      sources: groupPort({ channel: { supply: { dir: 'in', unit: '' } }, desc: 'Suppliers feeding the bus' }),
      loads: groupPort({
        channel: { demand: { dir: 'in', unit: '' }, grant: { dir: 'out', unit: '' } },
        meta: { band: 0 },
        desc: 'Prioritised consumers (meta.band: 0 = highest priority)',
      }),
    },
    state: () => ({ supply: 0, demanded: 0, served: 0, order: null as number[] | null }),

    resolve(ctx) {
      const sources = ctx.group('sources');
      const loads = ctx.group('loads');

      let supply = 0;
      for (let i = 0; i < sources.length; i++) supply += sources[i].in.supply;

      // Stable order by band (band 0 first). Cached — bands are static join meta.
      const order = (ctx.state.order ??= loads.map((_, i) => i).sort((a, b) => loads[a].meta.band - loads[b].meta.band));

      let remaining = supply;
      let demanded = 0;
      let served = 0;
      let i = 0;
      while (i < order.length) {
        const band = loads[order[i]].meta.band;
        let bandDemand = 0;
        let j = i;
        while (j < order.length && loads[order[j]].meta.band === band) {
          bandDemand += Math.max(0, loads[order[j]].in.demand);
          j++;
        }
        const frac = bandDemand > 0 ? Math.min(1, Math.max(0, remaining) / bandDemand) : 0;
        for (let k = i; k < j; k++) {
          const l = loads[order[k]];
          const g = l.in.demand > 0 ? l.in.demand * frac : 0;
          l.out.grant = g;
          served += g;
        }
        remaining -= frac * bandDemand;
        demanded += bandDemand;
        i = j;
      }

      ctx.state.supply = supply;
      ctx.state.demanded = demanded;
      ctx.state.served = served;
      // The Studio charts read these series (unchanged names).
      ctx.emit(`bus.${commodity}.offered`, supply);
      ctx.emit(`bus.${commodity}.demanded`, demanded);
      ctx.emit(`bus.${commodity}.served`, served);
      ctx.emit(`bus.${commodity}.unmet`, Math.max(0, demanded - served));
    },

    step() {},
    status: (ctx) => (ctx.state.demanded - ctx.state.served > 1e-6 ? 'degraded' : 'nominal'),
    keyFigures: (ctx) => [
      ['Supply', ctx.state.supply, ''],
      ['Served', ctx.state.served, ''],
      ['Unmet', Math.max(0, ctx.state.demanded - ctx.state.served), ''],
    ],
  });
}

/**
 * A prioritised load. Posts its demand in `declare`, receives a grant during the
 * bus's `resolve`, and reports what it got in `step`. Priority (`band`) is set
 * where it belongs — on the join in the scenario, not baked into the model.
 */
export function busLoad(commodity: string): ModelDef {
  return defineModel({
    type: `Load:${commodity}`,
    description: `A prioritised load on the ${commodity} bus.`,
    ports: { demand: outPort(''), grant: inPort(''), served: outPort('') },
    params: { demand: param(0, '', 'Requested amount') },
    state: () => ({}),
    declare(ctx) {
      ctx.out.demand = ctx.params.demand;
    },
    step(ctx) {
      ctx.out.served = ctx.in.grant;
    },
    keyFigures: (ctx) => [['Served', ctx.in.grant, '']],
  });
}

/** A supplier: offers a fixed amount of the commodity to the bus each step. */
export function busSource(commodity: string): ModelDef {
  return defineModel({
    type: `Source:${commodity}`,
    description: `A ${commodity} supplier feeding the bus.`,
    ports: { supply: outPort('') },
    params: { supply: param(0, '', 'Supply offered') },
    state: () => ({}),
    declare(ctx) {
      ctx.out.supply = ctx.params.supply;
    },
    step() {},
  });
}
