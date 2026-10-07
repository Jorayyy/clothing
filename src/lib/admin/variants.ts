export interface AttributeInput {
  key: string;
  name: string;
  values: string[];
}

export interface VariantCombo {
  name: string;
  options: Record<string, string>;
}

export function variantSignature(options: Record<string, string>): string {
  return JSON.stringify(
    Object.entries(options)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

/**
 * Cartesian product of every option axis. Returns an empty list when the
 * result would exceed `cap`, so a bad combination cannot lock up the admin UI.
 */
export function buildVariantCombos(attributes: AttributeInput[], cap = 96): VariantCombo[] {
  if (attributes.length === 0) return [];

  let combos: Record<string, string>[] = [{}];
  for (const attribute of attributes) {
    const key = attribute.key.trim().toLowerCase();
    const values = attribute.values.filter((value) => value.trim() !== '');
    if (!key || values.length === 0) return [];

    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const value of values) next.push({ ...combo, [key]: value });
    }
    combos = next;
    if (combos.length > cap) return [];
  }

  return combos.map((options) => ({
    name: Object.values(options).join(' / '),
    options,
  }));
}
