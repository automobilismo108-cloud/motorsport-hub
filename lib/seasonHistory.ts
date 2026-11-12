export type SeasonArchive = {
  category: "F1" | "F2" | "F3";
  season: number;
  finalizedAt: string;
  drivers: Array<{ id:string; name:string; team:string; points:number; wins:number; podiums:number; position:number }>;
  teams: Array<{ id:string; name:string; points:number; position:number }>;
  races: Array<Record<string, unknown>>;
  results: Array<Record<string, unknown>>;
};

export function buildSeasonArchive(
  category: SeasonArchive["category"],
  season: number,
  drivers: Array<{id:string;name:string;teamId:string;points:number;wins:number;podiums:number}>,
  teams: Array<{id:string;name:string;points:number}>,
  races: object[],
  results: object[]
): SeasonArchive {
  const teamNames = new Map(teams.map(team => [team.id, team.name]));
  return {
    category, season, finalizedAt: new Date().toISOString(),
    drivers: drivers.map((driver,index)=>({
      id:driver.id,name:driver.name,team:teamNames.get(driver.teamId) ?? "Sem equipe",
      points:driver.points,wins:driver.wins,podiums:driver.podiums,position:index+1
    })),
    teams: teams.map((team,index)=>({id:team.id,name:team.name,points:team.points,position:index+1})),
    races: races.map(race=>({...race})),
    results: results.map(result=>({...result}))
  };
}
