export const ACTIVE_SEASON = 2026;
export const REQUIRED_SUPER_LICENSE_POINTS = 40;

export type LicenseCategory = "F2" | "F3";
export type SuperLicenseAward = {
  id: string;
  driverKey: string;
  driverId: string;
  driverName: string;
  category: LicenseCategory;
  season: number;
  position: number;
  points: number;
};
export type LicenseDriver = { id: string; name: string; licenseId: string };
export type LicenseResult = { driverId: string; position: number | null; points: number; session?: "Sprint" | "Feature" };

const POINTS_BY_CATEGORY: Record<LicenseCategory, number[]> = {
  F2: [40, 35, 30, 25, 20, 15, 10, 8, 6, 4],
  F3: [30, 25, 20, 15, 12, 9, 7, 5, 3, 2],
};

export const LEGACY_F1_LICENSE_IDS: Record<string, string> = {
  d1:"driver:lando-norris", d2:"driver:oscar-piastri", d3:"driver:george-russell",
  d4:"driver:kimi-antonelli", d5:"driver:max-verstappen", d6:"driver:isack-hadjar",
  d7:"driver:charles-leclerc", d8:"driver:lewis-hamilton", d9:"driver:alexander-albon",
  d10:"driver:carlos-sainz", d11:"driver:liam-lawson", d12:"driver:arvid-lindblad",
  d13:"driver:fernando-alonso", d14:"driver:lance-stroll", d15:"driver:esteban-ocon",
  d16:"driver:oliver-bearman", d17:"driver:nico-hulkenberg", d18:"driver:gabriel-bortoleto",
  d19:"driver:pierre-gasly", d20:"driver:franco-colapinto", d21:"driver:sergio-perez",
  d22:"driver:valtteri-bottas",
};

export function getLegacyF1LicenseId(driverId: string): string | null {
  return LEGACY_F1_LICENSE_IDS[driverId] ?? null;
}

export function normalizeLicenseAwards(value: unknown): SuperLicenseAward[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object").map((item) => {
    const driverName = typeof item.driverName === "string" ? item.driverName : "Piloto";
    const category = item.category === "F3" ? "F3" : "F2";
    const season = Number(item.season) || ACTIVE_SEASON;
    const driverId = typeof item.driverId === "string" ? item.driverId : "";
    const legacyKey = "driver:" + driverName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      id: typeof item.id === "string" ? item.id : category + "-" + season + "-" + (driverId || legacyKey),
      driverKey: typeof item.driverKey === "string" && item.driverKey ? item.driverKey : legacyKey,
      driverId, driverName, category, season,
      position: Number(item.position) || 0, points: Number(item.points) || 0,
    };
  });
}

export function getSuperLicensePoints(awards: SuperLicenseAward[], driverKey: string | null | undefined, activeSeason = ACTIVE_SEASON): number {
  if (!driverKey) return 0;
  const firstSeason = activeSeason - 2;
  return awards.reduce((total, award) => award.driverKey === driverKey && award.season >= firstSeason && award.season <= activeSeason ? total + award.points : total, 0);
}

function compareSeasonDrivers(
  a: { points: number; wins: number; podiums: number; positions: number[] },
  b: { points: number; wins: number; podiums: number; positions: number[] },
): number {
  if (a.points !== b.points) return b.points - a.points;
  if (a.wins !== b.wins) return b.wins - a.wins;
  if (a.podiums !== b.podiums) return b.podiums - a.podiums;
  for (let i = 1; i < a.positions.length; i += 1) {
    if (a.positions[i] !== b.positions[i]) return b.positions[i] - a.positions[i];
  }
  return 0;
}

export function buildSuperLicenseAwards(category: LicenseCategory, season: number, drivers: LicenseDriver[], results: LicenseResult[]): SuperLicenseAward[] {
  const ranked = drivers.map((driver) => {
    const rows = results.filter((result) => result.driverId === driver.id);
    const positions = Array.from({ length: 40 }, (_, index) => rows.filter((result) => result.position === index + 1).length);
    return {
      driver,
      points: rows.reduce((total, result) => total + result.points, 0),
      wins: positions[0],
      podiums: positions[0] + positions[1] + positions[2],
      positions,
    };
  }).sort(compareSeasonDrivers);

  const awards: SuperLicenseAward[] = [];
  let rank = 0;
  for (let index = 0; index < ranked.length; index += 1) {
    if (index === 0 || compareSeasonDrivers(ranked[index], ranked[index - 1]) !== 0) rank = index + 1;
    if (rank > 10) continue;
    const entry = ranked[index];
    awards.push({
      id: category + "-" + season + "-" + entry.driver.licenseId,
      driverKey: entry.driver.licenseId, driverId: entry.driver.id,
      driverName: entry.driver.name, category, season, position: rank,
      points: POINTS_BY_CATEGORY[category][rank - 1],
    });
  }
  return awards;
}

export function getSuperLicenseWindow(activeSeason = ACTIVE_SEASON): [number, number, number] {
  return [activeSeason - 2, activeSeason - 1, activeSeason];
}
