import { registry, type Scenario } from '@modelflow/core';
import { arbitratedBus, busLoad } from '@modelflow/std';
import { SolarPanel } from '../../examples/src/solarPanel';
import { DiurnalIrradiance, Inverter } from './demoModels';

/**
 * A rooftop solar microgrid (on Earth). The sun drives two PV arrays (which put
 * out watts); inverters tie them to a shared power bus (in kilowatts — auto-
 * converted). Three building loads draw from the bus at different priorities:
 * essential circuits first, then HVAC, then EV charging. When a cloud passes or
 * the sun sets and supply falls short, the lowest-priority load (EV charging) is
 * shed first. It exercises ports, unit auto-conversion, hierarchy, buses, and
 * priority arbitration in one legible demo.
 */
export const microgridRegistry = registry(
  arbitratedBus('power'),
  SolarPanel,
  DiurnalIrradiance,
  Inverter,
  busLoad('power'),
);

export const microgrid: Scenario = {
  version: 1,
  name: 'solar-microgrid',
  seed: 7,
  timestepSeconds: 3600, // 1 hour
  durationSeconds: 86400 * 4,
  sampleEverySteps: 1,
  commodities: [{ id: 'power', name: 'Power', unit: 'kW', kind: 'flow' }],
  instances: [
    { key: 'grid', type: 'Bus:power' },
    { key: 'sun', type: 'DiurnalIrradiance', parent: 'grid', connect: { irradiance: 'sun' } },
    { key: 'array_A', type: 'SolarPanel', parent: 'grid', params: { area: 45 }, connect: { irradiance: 'sun', power: 'dc_A' } },
    { key: 'array_B', type: 'SolarPanel', parent: 'grid', params: { area: 30 }, connect: { irradiance: 'sun', power: 'dc_B' } },
    { key: 'inv_A', type: 'Inverter', parent: 'grid', connect: { dc: 'dc_A' }, join: [{ group: 'grid.sources', wire: { supply: 'ac' } }] },
    { key: 'inv_B', type: 'Inverter', parent: 'grid', connect: { dc: 'dc_B' }, join: [{ group: 'grid.sources', wire: { supply: 'ac' } }] },
    { key: 'essential', type: 'Load:power', parent: 'grid', params: { demand: 4 }, connect: { served: 'sv_essential' }, join: [{ group: 'grid.loads', meta: { band: 0 } }] },
    { key: 'hvac', type: 'Load:power', parent: 'grid', params: { demand: 3 }, connect: { served: 'sv_hvac' }, join: [{ group: 'grid.loads', meta: { band: 1 } }] },
    { key: 'ev_charging', type: 'Load:power', parent: 'grid', params: { demand: 12 }, connect: { served: 'sv_ev' }, join: [{ group: 'grid.loads', meta: { band: 2 } }] },
  ],
};
