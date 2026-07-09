/**
 * Dimensional-analysis unit engine.
 *
 * Every unit resolves to a dimension vector over nine base dimensions plus a
 * linear scale (and offset, for affine units like °C). Two units are
 * *compatible* iff their dimension vectors match; ModelFlow uses this to reject
 * nonsensical wiring (power into mass-flow) at build time and to auto-convert
 * compatible-but-different units (W → kW, °C → K, kg/s → t/day) on the fly.
 *
 * The parser understands SI prefixes and compound expressions:
 *   'kW', 'kg/s', 'W/m^2', 'kg*m/s^2', 'kW·h', 'J/(kg·K)', 'mmHg', 't/day'.
 */

/** Base dimensions: mass, length, time, current, temperature, amount, luminous, currency, information. */
export const DIM_NAMES = ['kg', 'm', 's', 'A', 'K', 'mol', 'cd', '$', 'bit'] as const;
export type Dimension = readonly number[]; // length 9

/** A fully resolved unit: value_SI = value * scale + offset, in the unit's dimension. */
export interface ResolvedUnit {
  dim: Dimension;
  scale: number;
  offset: number;
  /** The canonical input string (for diagnostics). */
  symbol: string;
}

const ZERO: Dimension = [0, 0, 0, 0, 0, 0, 0, 0, 0];
function dim(...d: number[]): Dimension {
  const out = ZERO.slice();
  for (let i = 0; i < d.length; i++) out[i] = d[i];
  return out;
}
function addDim(a: Dimension, b: Dimension, bScale: number): number[] {
  const out = a.slice();
  for (let i = 0; i < out.length; i++) out[i] += b[i] * bScale;
  return out;
}
export function dimEqual(a: Dimension, b: Dimension): boolean {
  for (let i = 0; i < a.length; i++) if (Math.abs((a[i] ?? 0) - (b[i] ?? 0)) > 1e-9) return false;
  return true;
}

// --- base + derived unit table (symbol -> unit at SI scale) ---
type U = { dim: Dimension; scale: number; offset?: number };
const BASE: Record<string, U> = {
  // dimensionless
  '': { dim: ZERO, scale: 1 },
  '1': { dim: ZERO, scale: 1 },
  '%': { dim: ZERO, scale: 0.01 },
  rad: { dim: ZERO, scale: 1 },
  count: { dim: ZERO, scale: 1 },
  people: { dim: ZERO, scale: 1 },
  frac: { dim: ZERO, scale: 1 },
  // SI base
  g: { dim: dim(1), scale: 1e-3 }, // gram (kg handled via k-prefix on g, but kg is common → alias below)
  kg: { dim: dim(1), scale: 1 },
  t: { dim: dim(1), scale: 1e3 }, // tonne
  m: { dim: dim(0, 1), scale: 1 },
  s: { dim: dim(0, 0, 1), scale: 1 },
  A: { dim: dim(0, 0, 0, 1), scale: 1 },
  K: { dim: dim(0, 0, 0, 0, 1), scale: 1 },
  mol: { dim: dim(0, 0, 0, 0, 0, 1), scale: 1 },
  cd: { dim: dim(0, 0, 0, 0, 0, 0, 1), scale: 1 },
  USD: { dim: dim(0, 0, 0, 0, 0, 0, 0, 1), scale: 1 },
  bit: { dim: dim(0, 0, 0, 0, 0, 0, 0, 0, 1), scale: 1 },
  byte: { dim: dim(0, 0, 0, 0, 0, 0, 0, 0, 1), scale: 8 },
  // time
  min: { dim: dim(0, 0, 1), scale: 60 },
  h: { dim: dim(0, 0, 1), scale: 3600 },
  hr: { dim: dim(0, 0, 1), scale: 3600 },
  day: { dim: dim(0, 0, 1), scale: 86400 },
  yr: { dim: dim(0, 0, 1), scale: 31557600 },
  // length / area / volume
  L: { dim: dim(0, 3), scale: 1e-3 },
  // force / energy / power / pressure
  N: { dim: dim(1, 1, -2), scale: 1 },
  J: { dim: dim(1, 2, -2), scale: 1 },
  Wh: { dim: dim(1, 2, -2), scale: 3600 },
  cal: { dim: dim(1, 2, -2), scale: 4.184 },
  W: { dim: dim(1, 2, -3), scale: 1 },
  Pa: { dim: dim(1, -1, -2), scale: 1 },
  bar: { dim: dim(1, -1, -2), scale: 1e5 },
  atm: { dim: dim(1, -1, -2), scale: 101325 },
  mmHg: { dim: dim(1, -1, -2), scale: 133.322 },
  Torr: { dim: dim(1, -1, -2), scale: 133.322 },
  // electrical
  C: { dim: dim(0, 0, 1, 1), scale: 1 },
  V: { dim: dim(1, 2, -3, -1), scale: 1 },
  Ohm: { dim: dim(1, 2, -3, -2), scale: 1 },
  Hz: { dim: dim(0, 0, -1), scale: 1 },
  // affine temperature (offset in K)
  degC: { dim: dim(0, 0, 0, 0, 1), scale: 1, offset: 273.15 },
  degF: { dim: dim(0, 0, 0, 0, 1), scale: 5 / 9, offset: 255.3722222222222 },
};
// Unicode aliases
BASE['°C'] = BASE.degC;
BASE['°F'] = BASE.degF;
BASE['Ω'] = BASE.Ohm;

const PREFIX: Record<string, number> = {
  Y: 1e24, Z: 1e21, E: 1e18, P: 1e15, T: 1e12, G: 1e9, M: 1e6, k: 1e3, h: 1e2, da: 1e1,
  d: 1e-1, c: 1e-2, m: 1e-3, u: 1e-6, µ: 1e-6, μ: 1e-6, n: 1e-9, p: 1e-12, f: 1e-15, a: 1e-18, z: 1e-21, y: 1e-24,
};

function resolveAtom(sym: string): U {
  if (sym in BASE) return BASE[sym];
  // longest-prefix-first so 'da' beats 'd'
  for (const len of [2, 1]) {
    if (sym.length > len) {
      const p = sym.slice(0, len);
      const rest = sym.slice(len);
      if (p in PREFIX && rest in BASE) {
        const base = BASE[rest];
        if (base.offset) throw new UnitError(`prefix "${p}" cannot apply to affine unit "${rest}"`);
        return { dim: base.dim, scale: base.scale * PREFIX[p] };
      }
    }
  }
  throw new UnitError(`unknown unit "${sym}"`);
}

export class UnitError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'UnitError';
  }
}

const cache = new Map<string, ResolvedUnit>();

/** Parse a (possibly compound) unit string into its dimension + scale + offset. */
export function parseUnit(input: string): ResolvedUnit {
  const key = input.trim();
  const hit = cache.get(key);
  if (hit) return hit;

  const cleaned = key.replace(/[()]/g, '').replace(/·/g, '*');
  // Split into numerator / denominator groups by '/'.
  const groups = cleaned.split('/');
  let d: number[] = ZERO.slice();
  let scale = 1;
  let offset = 0;
  let affine = false;

  groups.forEach((group, gi) => {
    const sign = gi === 0 ? 1 : -1;
    for (const raw of group.split('*')) {
      const factor = raw.trim();
      if (factor === '' || factor === '1') continue;
      // split symbol and exponent: 'm^2', 'm2', 's^-1', 'kg'
      const mExp = /^([^\d^-]+?)\^?(-?\d+)$/.exec(factor);
      let symbol = factor;
      let exp = 1;
      if (mExp) {
        symbol = mExp[1];
        exp = parseInt(mExp[2], 10);
      }
      const u = resolveAtom(symbol);
      if (u.offset) {
        if (affine || exp !== 1 || sign !== 1 || groups.length > 1) {
          throw new UnitError(`affine unit "${symbol}" cannot be combined or inverted`);
        }
        affine = true;
        offset = u.offset;
      }
      d = addDim(d, u.dim, sign * exp);
      scale *= Math.pow(u.scale, sign * exp);
    }
  });

  const resolved: ResolvedUnit = { dim: d, scale, offset, symbol: key };
  cache.set(key, resolved);
  return resolved;
}

/** True if two unit strings share a dimension (and can be converted). */
export function unitsCompatible(a: string, b: string): boolean {
  return dimEqual(parseUnit(a).dim, parseUnit(b).dim);
}

/** The affine transform taking a value in `from` to a value in `to`: v_to = v*k + o. */
export function conversion(from: string, to: string): { k: number; o: number } {
  const f = parseUnit(from);
  const t = parseUnit(to);
  if (!dimEqual(f.dim, t.dim)) {
    throw new UnitError(
      `incompatible units: "${from}" is ${describeDimension(f.dim)}, "${to}" is ${describeDimension(t.dim)}`,
    );
  }
  return { k: f.scale / t.scale, o: (f.offset - t.offset) / t.scale };
}

/** Convert a scalar value from one unit to another (throws if incompatible). */
export function convert(value: number, from: string, to: string): number {
  const { k, o } = conversion(from, to);
  return value * k + o;
}

// --- human-readable dimension names for diagnostics + the catalog ---
const NAMED: Array<[Dimension, string]> = [
  [ZERO, 'dimensionless'],
  [dim(1), 'mass'],
  [dim(0, 1), 'length'],
  [dim(0, 2), 'area'],
  [dim(0, 3), 'volume'],
  [dim(0, 0, 1), 'time'],
  [dim(0, 1, -1), 'velocity'],
  [dim(1, 0, -1), 'mass flow'],
  [dim(1, 1, -2), 'force'],
  [dim(1, 2, -2), 'energy'],
  [dim(1, 2, -3), 'power'],
  [dim(1, -1, -2), 'pressure'],
  [dim(1, 0, -3), 'power density'], // W/m^2 is dim(1,0,-3)
  [dim(0, 0, 0, 0, 1), 'temperature'],
  [dim(0, 0, 0, 1), 'current'],
  [dim(0, 0, 0, 0, 0, 1), 'amount'],
  [dim(0, 0, 0, 0, 0, 0, 0, 1), 'currency'],
  [dim(0, 0, 0, 0, 0, 0, 0, 0, 1), 'information'],
];

/** A human name for a dimension vector, e.g. "power" or "kg·m²·s⁻³". */
export function describeDimension(d: Dimension): string {
  for (const [vec, name] of NAMED) if (dimEqual(vec, d)) return name;
  const parts: string[] = [];
  for (let i = 0; i < d.length; i++) if (d[i]) parts.push(`${DIM_NAMES[i]}^${d[i]}`);
  return parts.length ? parts.join('·') : 'dimensionless';
}
