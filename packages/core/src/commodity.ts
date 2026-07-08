import type { Unit } from './types';

/**
 * An open registry of resources that flow on buses (power, water, O2, labor,
 * money, …). This replaces the fixed `Resource` enum a domain sim would
 * otherwise hard-code, so the core stays domain-free.
 */
export interface CommoditySpec {
  readonly id: string;
  readonly name: string;
  readonly unit: Unit;
  /** `flow` = a rate arbitrated each step; `level` = a stock (a stored amount). */
  readonly kind: 'flow' | 'level';
  /** Enables the engine's optional conservation audit. */
  readonly conserved?: boolean;
}

export class CommodityRegistry {
  private readonly byId = new Map<string, CommoditySpec>();

  register(spec: CommoditySpec): void {
    this.byId.set(spec.id, spec);
  }

  get(id: string): CommoditySpec | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  ids(): string[] {
    return [...this.byId.keys()];
  }
}
