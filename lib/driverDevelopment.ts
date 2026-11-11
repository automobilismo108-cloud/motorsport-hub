export type DriverAttributes = { racePace: number; qualifying: number; overtaking: number; defending: number; consistency: number };
export type DevelopmentHistory = { category: "F1" | "F2" | "F3"; season: number; position: number; overallBefore: number; overallAfter: number; change: number };
export type DriverDevelopmentRecord = { attributes: DriverAttributes; potential: number; age: number; history: DevelopmentHistory[] };
export type DriverDevelopmentState = Record<string, DriverDevelopmentRecord>;

const ATTRIBUTE_KEYS: (keyof DriverAttributes)[] = ["racePace", "qualifying", "overtaking", "defending", "consistency"];
const clamp = (value: number, min = 1, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const average = (attributes: DriverAttributes) => ATTRIBUTE_KEYS.reduce((sum, key) => sum + attributes[key], 0) / ATTRIBUTE_KEYS.length;

export function getDriverDevelopment(
  state: DriverDevelopmentState,
  driverKey: string,
  base: { age: number; attributes: DriverAttributes },
  season = 2026,
): DriverDevelopmentRecord {
  const existing = state[driverKey];
  if (existing) return existing;
  const age = Math.max(15, base.age + Math.max(0, season - 2026));
  const overall = average(base.attributes);
  const potential = clamp(Math.max(overall + 2, overall + Math.max(2, Math.min(15, (25 - age) * 0.65 + 5))), 50, 99);
  return { attributes: { ...base.attributes }, potential, age, history: [] };
}

export function evolveDriverSeason(
  state: DriverDevelopmentState,
  category: "F1" | "F2" | "F3",
  season: number,
  drivers: Array<{ id: string; licenseId?: string; name: string }>,
  baseDetails: Record<string, { age: number; attributes: DriverAttributes }>,
  results: Array<{ driverId: string; points: number }>,
): DriverDevelopmentState {
  const ranked = drivers.map(driver => ({
    driver,
    points: results.filter(result => result.driverId === driver.id).reduce((sum, result) => sum + result.points, 0),
  })).sort((a, b) => b.points - a.points);
  const next = { ...state };
  ranked.forEach(({ driver }, index) => {
    const key = driver.licenseId || driver.id;
    const base = baseDetails[driver.name];
    if (!base) return;
    const current = getDriverDevelopment(next, key, base, season);
    if (current.history.some(item => item.category === category && item.season === season)) return;
    const position = index + 1;
    const percentile = ranked.length <= 1 ? 0 : (ranked.length - position) / (ranked.length - 1);
    let change = percentile >= 0.85 ? 2 : percentile >= 0.55 ? 1 : percentile <= 0.15 ? -1 : 0;
    if (current.age <= 21) change += 1;
    else if (current.age >= 36) change -= 1;
    if (current.age >= 42) change -= 1;
    const before = average(current.attributes);
    const attributes = { ...current.attributes };
    ATTRIBUTE_KEYS.forEach((attribute, attributeIndex) => {
      const individualDelta = change > 0 ? (attributeIndex === (position % ATTRIBUTE_KEYS.length) ? change + 1 : change) : change;
      const ceiling = current.potential;
      attributes[attribute] = clamp(Math.min(ceiling, attributes[attribute] + individualDelta));
    });
    const after = average(attributes);
    const history = [...current.history, { category, season, position, overallBefore: clamp(before), overallAfter: clamp(after), change: clamp(after) - clamp(before) }];
    next[key] = { ...current, attributes, age: current.age + 1, history };
  });
  return next;
}
