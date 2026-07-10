/**
 * @modelflow/std/objects — a canonical, cited parameter database of real-world
 * objects.
 *
 * The problem this solves: to model something real — a solar panel, a home
 * battery, a rocket stage — you normally hunt its numbers across a dozen
 * datasheets, spec pages and Wikipedia tables, then hope you copied them right.
 * Here every object gathers its parameters in one place, each value carrying the
 * unit it's in and a link to where it came from, so a human (or an agent) can
 * pull a trustworthy figure without the scavenger hunt.
 *
 * Where an object maps onto a behavioural model (`model` + per-param `mapsTo`),
 * its cited values can seed a live simulation directly.
 *
 * This is a curated seed set, not a claim to completeness. Figures are drawn
 * from the linked sources and were current when written; always click through
 * to the source of record before you bet a design on a number.
 */

/** A single parameter of a real-world object, with the source it came from. */
export interface ObjectParam {
  /** Human-readable label, e.g. "Usable energy". */
  readonly label: string;
  /** The value. Strings are allowed for categorical facts (e.g. propellant). */
  readonly value: number | string;
  /** Unit the value is expressed in ('' / omitted = dimensionless or textual). */
  readonly unit?: string;
  /** Short citation for this figure, e.g. "Powerwall 3 Datasheet". */
  readonly source?: string;
  /** Link to the source of record. */
  readonly url?: string;
  /** Caveats, test conditions, or how the figure was derived. */
  readonly notes?: string;
  /** If this object maps to a model, the model param key this value can seed. */
  readonly mapsTo?: string;
}

/** A real-world object: a named bundle of cited parameters. */
export interface LibraryObject {
  /** Stable slug, e.g. "tesla-powerwall-3". */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Grouping, e.g. "Energy storage". */
  readonly category: string;
  /** Manufacturer / operator, if applicable. */
  readonly maker?: string;
  /** One-line description. */
  readonly summary: string;
  /** Behavioural model type this object can instantiate (see `mapsTo`). */
  readonly model?: string;
  /** Free-text tags for search. */
  readonly tags?: readonly string[];
  /** Primary source of record for the object as a whole. */
  readonly primarySource?: { readonly citation: string; readonly url: string };
  /** The cited parameters. */
  readonly params: readonly ObjectParam[];
}

export const objects: readonly LibraryObject[] = [
  // ---- Solar --------------------------------------------------------------
  {
    id: 'sunpower-maxeon-6-440',
    name: 'SunPower Maxeon 6 (440 W)',
    category: 'Solar module',
    maker: 'Maxeon Solar',
    summary: 'High-efficiency residential monocrystalline (IBC) solar panel.',
    model: 'SolarPanel',
    tags: ['solar', 'pv', 'panel', 'photovoltaic', 'residential'],
    primarySource: {
      citation: 'Maxeon 6 DC 425–440 W datasheet',
      url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w',
    },
    params: [
      { label: 'Rated power (STC)', value: 440, unit: 'W', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w', notes: 'SPR-MAX6-440; Standard Test Conditions (1000 W/m², 25 °C, AM1.5).' },
      { label: 'Module efficiency', value: 22.8, unit: '%', mapsTo: 'efficiency', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w', notes: 'Maps to SolarPanel.efficiency as 0.228 (fraction).' },
      { label: 'Module area', value: 1.93, unit: 'm^2', mapsTo: 'area', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w', notes: '1872 × 1032 mm.' },
      { label: 'Power temperature coefficient', value: -0.29, unit: '%/°C', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w', notes: 'Equivalent to -0.0029 /K; used by higher-fidelity panel models with a cell-temperature input.' },
      { label: 'Open-circuit voltage (Voc)', value: 48.2, unit: 'V', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w' },
      { label: 'Short-circuit current (Isc)', value: 11.58, unit: 'A', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w' },
      { label: 'Voltage at max power (Vmpp)', value: 40.5, unit: 'V', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w' },
      { label: 'Weight', value: 21.8, unit: 'kg', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w' },
      { label: 'Product warranty', value: 40, unit: 'yr', source: 'Maxeon 6 datasheet', url: 'https://www.maxeon.com/technical-documents/maxeon-6-dc-425-440-w' },
    ],
  },

  // ---- Power electronics --------------------------------------------------
  {
    id: 'enphase-iq8ac',
    name: 'Enphase IQ8AC Microinverter',
    category: 'Power electronics',
    maker: 'Enphase Energy',
    summary: 'Grid-forming module-level microinverter for residential PV.',
    model: 'Inverter',
    tags: ['inverter', 'microinverter', 'solar', 'power', 'grid-forming'],
    primarySource: {
      citation: 'Enphase IQ8 series microinverters datasheet',
      url: 'https://enphase.com/download/iq8-series-microinverters-data-sheet',
    },
    params: [
      { label: 'Max continuous output', value: 349, unit: 'VA', source: 'IQ8AC datasheet', url: 'https://enphase.com/download/iq8-series-microinverters-data-sheet', notes: 'IQ8AC-72-M-US at 240 VAC (345 VA at 208 VAC).' },
      { label: 'CEC weighted efficiency', value: 97.0, unit: '%', mapsTo: 'efficiency', source: 'IQ8AC datasheet', url: 'https://enphase.com/download/iq8-series-microinverters-data-sheet', notes: 'Maps to Inverter.efficiency as 0.97. 96.5% at 208 VAC.' },
      { label: 'Peak efficiency', value: 97.6, unit: '%', source: 'IQ8AC datasheet', url: 'https://enphase.com/download/iq8-series-microinverters-data-sheet' },
      { label: 'Nominal output voltage', value: 240, unit: 'V', source: 'IQ8AC datasheet', url: 'https://enphase.com/download/iq8-series-microinverters-data-sheet', notes: 'Split-phase 240 VAC.' },
    ],
  },

  // ---- Energy storage -----------------------------------------------------
  {
    id: 'tesla-powerwall-3',
    name: 'Tesla Powerwall 3',
    category: 'Energy storage',
    maker: 'Tesla',
    summary: 'Residential AC battery with integrated solar inverter.',
    model: 'Storage',
    tags: ['battery', 'storage', 'home', 'residential', 'lfp'],
    primarySource: {
      citation: 'Tesla Powerwall 3 Datasheet',
      url: 'https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf',
    },
    params: [
      { label: 'Usable energy', value: 13.5, unit: 'kWh', mapsTo: 'capacity', source: 'Powerwall 3 Datasheet', url: 'https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf' },
      { label: 'Continuous power', value: 11.5, unit: 'kW', source: 'Powerwall 3 Datasheet', url: 'https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf', notes: 'On-grid and backup; up to 4 units in parallel.' },
      { label: 'Max solar input', value: 20, unit: 'kW', source: 'Powerwall 3 Datasheet', url: 'https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf', notes: 'DC-coupled PV, 6 MPPTs.' },
      { label: 'Round-trip efficiency', value: 89, unit: '%', source: 'Powerwall 3 Datasheet', url: 'https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf', notes: 'AC round-trip. Tesla also cites 97.5% for DC solar-to-battery.' },
      { label: 'Weight', value: 130, unit: 'kg', source: 'Powerwall 3 Datasheet', url: 'https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf' },
    ],
  },
  {
    id: 'tesla-powerwall-2',
    name: 'Tesla Powerwall 2',
    category: 'Energy storage',
    maker: 'Tesla',
    summary: 'Previous-generation residential AC battery.',
    model: 'Storage',
    tags: ['battery', 'storage', 'home', 'residential'],
    primarySource: { citation: 'Tesla Powerwall 2 AC Datasheet', url: 'https://www.tesla.com/powerwall' },
    params: [
      { label: 'Usable energy', value: 13.5, unit: 'kWh', mapsTo: 'capacity', source: 'Powerwall 2 Datasheet', url: 'https://www.tesla.com/powerwall' },
      { label: 'Continuous power', value: 5, unit: 'kW', source: 'Powerwall 2 Datasheet', url: 'https://www.tesla.com/powerwall', notes: '7 kW peak.' },
      { label: 'Round-trip efficiency', value: 90, unit: '%', source: 'Powerwall 2 Datasheet', url: 'https://www.tesla.com/powerwall', notes: 'AC round-trip.' },
      { label: 'Depth of discharge', value: 100, unit: '%', source: 'Powerwall 2 Datasheet', url: 'https://www.tesla.com/powerwall' },
    ],
  },
  {
    id: 'tesla-megapack-2xl',
    name: 'Tesla Megapack 2 XL',
    category: 'Energy storage',
    maker: 'Tesla',
    summary: 'Utility-scale battery with integrated inverters and thermal management.',
    model: 'Storage',
    tags: ['battery', 'storage', 'grid', 'utility', 'bess'],
    primarySource: { citation: 'Tesla Megapack 2 XL Datasheet', url: 'https://www.tesla.com/megapack' },
    params: [
      { label: 'Energy capacity', value: 3.9, unit: 'MWh', mapsTo: 'capacity', source: 'Megapack 2 XL Datasheet', url: 'https://www.tesla.com/megapack', notes: 'Per unit; maps to Storage.capacity as 3900 kWh.' },
      { label: 'Power (4-hour)', value: 0.98, unit: 'MW', source: 'Megapack 2 XL Datasheet', url: 'https://www.tesla.com/megapack', notes: '4-hour discharge configuration.' },
      { label: 'Round-trip efficiency', value: 93.7, unit: '%', source: 'Megapack 2 XL Datasheet', url: 'https://www.tesla.com/megapack' },
      { label: 'Weight', value: 38000, unit: 'kg', source: 'Megapack 2 XL Datasheet', url: 'https://www.tesla.com/megapack', notes: '~84,000 lb.' },
    ],
  },

  // ---- Electric vehicle ---------------------------------------------------
  {
    id: 'tesla-model-3-lr-2024',
    name: 'Tesla Model 3 Long Range (2024)',
    category: 'Electric vehicle',
    maker: 'Tesla',
    summary: 'Dual-motor AWD sedan; its traction battery as a storage element.',
    model: 'Storage',
    tags: ['ev', 'car', 'battery', 'vehicle', 'transport'],
    primarySource: { citation: 'EPA / Tesla Model 3 (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Tesla_Model_3' },
    params: [
      { label: 'Usable battery energy', value: 82.0, unit: 'kWh', mapsTo: 'capacity', source: 'EVKX Model 3 LR specs', url: 'https://evkx.net/models/tesla/model_3/model_3_long_range/', notes: '85.3 kWh gross, 3.3 kWh buffer.' },
      { label: 'EPA range (AWD)', value: 342, unit: 'mi', source: 'InsideEVs / EPA', url: 'https://insideevs.com/news/719013/2024-tesla-model3-epa-range-consumption/' },
      { label: 'Energy consumption', value: 259, unit: 'Wh/mi', source: 'InsideEVs / EPA', url: 'https://insideevs.com/news/719013/2024-tesla-model3-epa-range-consumption/', notes: '3.9 mi/kWh combined, 18-inch wheels.' },
      { label: 'Peak DC charge power', value: 250, unit: 'kW', source: 'Tesla Supercharger V3', url: 'https://www.tesla.com/support/charging' },
    ],
  },

  // ---- Launch vehicles & engines ------------------------------------------
  {
    id: 'spacex-starship-ship-v2',
    name: 'SpaceX Starship (Ship, V2)',
    category: 'Launch vehicle',
    maker: 'SpaceX',
    summary: 'Fully-reusable upper stage / spacecraft of the Starship system.',
    tags: ['rocket', 'space', 'starship', 'upper-stage', 'spacecraft'],
    primarySource: {
      citation: 'SpaceX Starship (spacecraft) — Wikipedia',
      url: 'https://en.wikipedia.org/wiki/SpaceX_Starship_(spacecraft)',
    },
    params: [
      { label: 'Dry mass', value: 85, unit: 't', source: 'SpaceX Starship (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Starship_(spacecraft)', notes: 'Approximate, Block 2 (V2).' },
      { label: 'Propellant capacity', value: 1500, unit: 't', source: 'SpaceX Starship (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Starship', notes: 'V2: 1170 t LOX + 330 t liquid methane (up 25% from V1).' },
      { label: 'Payload to LEO (reusable)', value: 35, unit: 't', source: 'SpaceX Starship (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Starship', notes: 'Current V2 estimate; long-term target ~100 t.' },
      { label: 'Height', value: 52.1, unit: 'm', source: 'SpaceX Starship (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Starship_(spacecraft)' },
      { label: 'Diameter', value: 9, unit: 'm', source: 'SpaceX Starship (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Starship' },
      { label: 'Engines', value: '6 × Raptor (3 sea-level + 3 vacuum)', source: 'SpaceX Starship (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Starship_(spacecraft)' },
      { label: 'Propellant', value: 'Liquid oxygen / liquid methane', source: 'SpaceX Starship (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Starship' },
    ],
  },
  {
    id: 'spacex-super-heavy',
    name: 'SpaceX Super Heavy (Booster)',
    category: 'Launch vehicle',
    maker: 'SpaceX',
    summary: 'First stage of the Starship system; most powerful booster ever flown.',
    tags: ['rocket', 'space', 'starship', 'booster', 'first-stage'],
    primarySource: { citation: 'SpaceX Super Heavy — Wikipedia', url: 'https://en.wikipedia.org/wiki/SpaceX_Super_Heavy' },
    params: [
      { label: 'Engines', value: '33 × Raptor 2', source: 'Super Heavy (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Super_Heavy', notes: '13 inner + 20 outer.' },
      { label: 'Liftoff thrust', value: 74.4, unit: 'MN', source: 'Super Heavy (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Super_Heavy', notes: 'Raptor 2; ~7,590 tf. Higher with Raptor 3.' },
      { label: 'Propellant capacity', value: 3400, unit: 't', source: 'Super Heavy (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Super_Heavy', notes: '~2,800 t LOX + ~600 t liquid methane.' },
      { label: 'Height', value: 71, unit: 'm', source: 'Super Heavy (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Super_Heavy' },
      { label: 'Diameter', value: 9, unit: 'm', source: 'Super Heavy (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Super_Heavy' },
    ],
  },
  {
    id: 'spacex-raptor-2',
    name: 'SpaceX Raptor 2',
    category: 'Rocket engine',
    maker: 'SpaceX',
    summary: 'Full-flow staged-combustion methalox engine; the Starship system’s powerplant.',
    tags: ['rocket', 'engine', 'raptor', 'methalox', 'staged-combustion'],
    primarySource: { citation: 'SpaceX Raptor — Wikipedia', url: 'https://en.wikipedia.org/wiki/SpaceX_Raptor' },
    params: [
      { label: 'Thrust (sea level)', value: 2.26, unit: 'MN', source: 'SpaceX Raptor (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Raptor', notes: '~230 tf.' },
      { label: 'Specific impulse (sea level)', value: 347, unit: 's', source: 'SpaceX Raptor (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Raptor' },
      { label: 'Chamber pressure', value: 300, unit: 'bar', source: 'SpaceX Raptor (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Raptor', notes: 'Highest of any flown engine.' },
      { label: 'Engine mass', value: 1600, unit: 'kg', source: 'SpaceX Raptor (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Raptor', notes: 'Down from 2,000 kg (Raptor 1).' },
      { label: 'Propellant', value: 'Liquid oxygen / liquid methane', source: 'SpaceX Raptor (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SpaceX_Raptor' },
    ],
  },
];

/** Distinct object categories, in first-seen order. */
export function objectCategories(): string[] {
  const seen: string[] = [];
  for (const o of objects) if (!seen.includes(o.category)) seen.push(o.category);
  return seen;
}

/** Look up an object by its id. */
export function objectById(id: string): LibraryObject | undefined {
  return objects.find((o) => o.id === id);
}

/**
 * Free-text search over id / name / maker / category / tags / param labels.
 * Multi-word queries are AND'd token-by-token, so "home battery" matches a
 * "Residential AC battery" tagged `home`, `battery` even though that exact
 * phrase never appears.
 */
export function searchObjects(query: string): LibraryObject[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [...objects];
  return objects.filter((o) => {
    const hay = [
      o.id,
      o.name,
      o.maker ?? '',
      o.category,
      o.summary,
      ...(o.tags ?? []),
      ...o.params.map((p) => p.label),
    ]
      .join(' ')
      .toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}
