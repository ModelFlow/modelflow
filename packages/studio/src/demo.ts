import { registry, type Scenario } from '@modelflow/core';
import { arbitratedBus, busLoad, priorityProRata } from '@modelflow/std';
import { SolarPanel } from '../../examples/src/solarPanel';
import { DiurnalIrradiance, Inverter } from './demoModels';

/**
 * A solar microgrid: the sun drives two PV arrays (W), inverters tie them to a
 * power bus (kW — auto-converted), and three prioritised loads draw from it.
 * As the sun rises the bus fills; when it can't cover everything, the priority
 * policy sheds the low-priority ISRU load first. Exercises ports, unit
 * auto-conversion, hierarchy, buses, and arbitration in one legible demo.
 */
export const microgridRegistry = registry(
  arbitratedBus('power', priorityProRata()),
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
    { key: 'inv_A', type: 'Inverter', parent: 'grid', connect: { dc: 'dc_A' } },
    { key: 'inv_B', type: 'Inverter', parent: 'grid', connect: { dc: 'dc_B' } },
    { key: 'life_support', type: 'Load:power', parent: 'grid', params: { demand: 4, band: 0 }, connect: { served: 'sv_ls' } },
    { key: 'habitat', type: 'Load:power', parent: 'grid', params: { demand: 3, band: 1 }, connect: { served: 'sv_hab' } },
    { key: 'isru_plant', type: 'Load:power', parent: 'grid', params: { demand: 12, band: 2 }, connect: { served: 'sv_isru' } },
  ],
};
