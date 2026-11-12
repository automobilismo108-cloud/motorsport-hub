export type DriverAttributes = { racePace: number; qualifying: number; overtaking: number; defending: number; consistency: number };
export type DevelopmentHistory = { category: "F1" | "F2" | "F3"; season: number; position: number; overallBefore: number; overallAfter: number; change: number };
export type DriverDevelopmentRecord = { attributes: DriverAttributes; potential: number; age: number; history: DevelopmentHistory[] };
export type DriverDevelopmentState = Record<string, DriverDevelopmentRecord>;

// Somente os cinco atributos já existentes nas fichas são desenvolvidos.
const ATTRIBUTE_KEYS: (keyof DriverAttributes)[] = ["racePace", "qualifying", "overtaking", "defending", "consistency"];
const clamp = (value: number, min = 1, max = 100) => Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
const average = (attributes: DriverAttributes) => ATTRIBUTE_KEYS.reduce((sum, key) => sum + attributes[key], 0) / ATTRIBUTE_KEYS.length;
const normalizeAttributes = (attributes: DriverAttributes): DriverAttributes => ({
  racePace: clamp(attributes.racePace), qualifying: clamp(attributes.qualifying),
  overtaking: clamp(attributes.overtaking), defending: clamp(attributes.defending),
  consistency: clamp(attributes.consistency),
});

export function getDriverDevelopment(state: DriverDevelopmentState, driverKey: string, base: { age: number; attributes: DriverAttributes }, season = 2026): DriverDevelopmentRecord {
  const existing = state[driverKey];
  if (existing) {
    const attributes = normalizeAttributes(existing.attributes);
    const highestCurrent = Math.max(...ATTRIBUTE_KEYS.map(key => attributes[key]));
    return {
      ...existing, attributes,
      // Não reduz dados existentes: o teto nunca fica abaixo de um atributo já salvo.
      potential: clamp(Math.max(existing.potential, highestCurrent)),
      age: clamp(existing.age, 15, 60),
      history: Array.isArray(existing.history) ? existing.history : [],
    };
  }
  const age = Math.max(15, base.age + Math.max(0, season - 2026));
  const attributes = normalizeAttributes(base.attributes);
  const overall = average(attributes);
  const strongestAttribute = Math.max(...ATTRIBUTE_KEYS.map(key => attributes[key]));
  const potential = clamp(Math.max(strongestAttribute, overall + Math.max(2, Math.min(15, (25 - age) * 0.65 + 5))));
  return { attributes, potential, age, history: [] };
}

export function evolveDriverSeason(
  state: DriverDevelopmentState, category: "F1" | "F2" | "F3", season: number,
  drivers: Array<{ id: string; licenseId?: string; name: string }>,
  baseDetails: Record<string, { age: number; attributes: DriverAttributes }>,
  results: Array<{ driverId: string; points: number }>,
): DriverDevelopmentState {
  const ranked = drivers.map(driver => ({
    driver,
    points: results.filter(result => result.driverId === driver.id).reduce((sum, result) => sum + (Number(result.points) || 0), 0),
  })).sort((a, b) => b.points - a.points || a.driver.name.localeCompare(b.driver.name, "pt-BR"));
  const next = { ...state };
  ranked.forEach(({ driver }, index) => {
    const key = driver.licenseId || driver.id;
    const base = baseDetails[driver.name] ?? (next[key] ? { age: next[key].age, attributes: next[key].attributes } : undefined);
    if (!base) return;
    const current = getDriverDevelopment(next, key, base, season);
    // Evita aplicar a mesma temporada mais de uma vez ao mesmo piloto.
    if (current.history.some(item => item.season === season)) return;
    const position = index + 1;
    const percentile = ranked.length <= 1 ? 0 : (ranked.length - position) / (ranked.length - 1);
    let growth = percentile >= 0.85 ? 2 : percentile >= 0.55 ? 1 : percentile <= 0.15 ? -1 : 0;
    if (current.age <= 21) growth += 1;
    else if (current.age >= 36) growth -= 1;
    if (current.age >= 42) growth -= 1;
    const before = average(current.attributes);
    const attributes: DriverAttributes = { ...current.attributes };
    ATTRIBUTE_KEYS.forEach((attribute, attributeIndex) => {
      const delta = growth > 0 ? (attributeIndex === (position % ATTRIBUTE_KEYS.length) ? growth + 1 : growth) : growth;
      attributes[attribute] = clamp(current.attributes[attribute] + delta, 1, current.potential);
    });
    const after = average(attributes);
    const history = [...current.history, {
      category, season, position, overallBefore: clamp(before), overallAfter: clamp(after),
      change: clamp(after) - clamp(before),
    }];
    next[key] = { ...current, attributes, age: current.age + 1, history };
  });
  return next;
}
