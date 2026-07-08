import type { ModelDef } from './model';

/** Maps a scenario's `type` strings to their model definitions. */
export class ModelRegistry {
  private readonly byType = new Map<string, ModelDef>();

  /** Register one or many model definitions. */
  add(...defs: ModelDef[]): this {
    for (const d of defs) this.byType.set(d.type, d);
    return this;
  }

  get(type: string): ModelDef | undefined {
    return this.byType.get(type);
  }

  has(type: string): boolean {
    return this.byType.has(type);
  }

  types(): string[] {
    return [...this.byType.keys()];
  }
}

export function registry(...defs: ModelDef[]): ModelRegistry {
  return new ModelRegistry().add(...defs);
}
