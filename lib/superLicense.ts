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
  version: number;
  finalized?: boolean;
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

function legacyDriverKey(name: string): string {
  return "driver:" + name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function normalizeLicenseAwards(value: unknown): SuperLicenseAward[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object").map((item) => {
    const driverName = typeof item.driverName === "string" ? item.driverName : "Piloto";
    const category = item.category === "F3" ? "F3" : "F2";
    const season = Number(item.season) || ACTIVE_SEASON;
    const driverId = typeof item.driverId === "string" ? item.driverId : "";
    const driverKey = typeof item.driverKey === "string" && item.driverKey
      ? item.driverKey
      : legacyDriverKey(driverName);
    return {
      id: typeof item.id === "string" ? item.id : category + "-" + season + "-" + (driverId || driverKey),
      driverKey, driverId, driverName, category, season,
      position: Number(item.position) || 0,
      points: Math.max(0, Number(item.points) || 0),
      version: Number(item.version) || 1,
      finalized: item.finalized === true,
    };
  });
}

/** Collapse historical duplicate rows for the same driver/category/season before adding points. */
function uniqueAwards(awards: SuperLicenseAward[]): SuperLicenseAward[] {
  const unique = new Map<string, SuperLicenseAward>();
  for (const award of awards) {
    const key = [award.driverKey, award.category, award.season].join("|");
    const previous = unique.get(key);
    if (!previous || award.version > previous.version || (award.version === previous.version && award.points >= previous.points)) {
      unique.set(key, award);
    }
  }
  return [...unique.values()];
}

export function getSuperLicensePoints(awards: SuperLicenseAward[], driverKey: string | null | undefined, activeSeason = ACTIVE_SEASON): number {
  if (!driverKey) return 0;
  const firstSeason = activeSeason - 2;
  return uniqueAwards(awards).reduce((total, award) =>
    award.driverKey === driverKey && award.season >= firstSeason && award.season <= activeSeason
      ? total + award.points
      : total, 0);
}

function compareSeasonDrivers(
  a: { points: number; wins: number; podiums: number; secondPlaces: number; thirdPlaces: number; gridOrder: number },
  b: { points: number; wins: number; podiums: number; secondPlaces: number; thirdPlaces: number; gridOrder: number },
): number {
  return b.points - a.points ||
    b.wins - a.wins ||
    b.podiums - a.podiums ||
    b.secondPlaces - a.secondPlaces ||
    b.thirdPlaces - a.thirdPlaces ||
    a.gridOrder - b.gridOrder;
}

export function buildSuperLicenseAwards(category: LicenseCategory, season: number, drivers: LicenseDriver[], results: LicenseResult[]): SuperLicenseAward[] {
  const ranked = drivers.map((driver, gridOrder) => {
    const rows = results.filter(result => result.driverId === driver.id);
    return {
      driver,
      points: rows.reduce((total, result) => total + Math.max(0, Number(result.points) || 0), 0),
      wins: rows.filter(result => result.position === 1).length,
      podiums: rows.filter(result => result.position !== null && result.position <= 3).length,
      secondPlaces: rows.filter(result => result.position === 2).length,
      thirdPlaces: rows.filter(result => result.position === 3).length,
      gridOrder,
    };
  }).sort(compareSeasonDrivers);

  if (ranked.length === 0 || ranked[0].points <= 0) return [];
  return ranked.slice(0, 10).map((entry, index) => ({
    id: category + "-" + season + "-" + entry.driver.licenseId,
    driverKey: entry.driver.licenseId,
    driverId: entry.driver.id,
    driverName: entry.driver.name,
    category,
    season,
    position: index + 1,
    points: POINTS_BY_CATEGORY[category][index],
    version: 3,
  }));
}

export function getSuperLicenseWindow(activeSeason = ACTIVE_SEASON): [number, number, number] {
  return [activeSeason - 2, activeSeason - 1, activeSeason];
}
