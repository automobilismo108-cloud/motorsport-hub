export type TeamPhilosophy = "vencedora" | "formadora" | "conservadora" | "agressiva" | "reconstrucao" | "equilibrada";
export type TeamDecisionProfile = { philosophy: TeamPhilosophy; performanceWeight: number; potentialWeight: number; experienceWeight: number; loyaltyWeight: number; riskTolerance: number; summary: string };

const PROFILES: Record<string, TeamDecisionProfile> = {
  mcl:{philosophy:"vencedora",performanceWeight:0.55,potentialWeight:0.2,experienceWeight:0.15,loyaltyWeight:0.1,riskTolerance:0.45,summary:"Prioriza resultados imediatos e pilotos completos."},
  mer:{philosophy:"equilibrada",performanceWeight:0.4,potentialWeight:0.25,experienceWeight:0.2,loyaltyWeight:0.15,riskTolerance:0.4,summary:"Busca equilíbrio entre velocidade, experiência e futuro."},
  red:{philosophy:"agressiva",performanceWeight:0.45,potentialWeight:0.35,experienceWeight:0.1,loyaltyWeight:0.1,riskTolerance:0.8,summary:"Aceita riscos e aposta alto em talento e desempenho."},
  fer:{philosophy:"vencedora",performanceWeight:0.5,potentialWeight:0.2,experienceWeight:0.2,loyaltyWeight:0.1,riskTolerance:0.35,summary:"Exige desempenho e experiência para disputar títulos."},
  wil:{philosophy:"formadora",performanceWeight:0.25,potentialWeight:0.45,experienceWeight:0.1,loyaltyWeight:0.2,riskTolerance:0.7,summary:"Valoriza jovens talentos e crescimento de longo prazo."},
  rb:{philosophy:"formadora",performanceWeight:0.25,potentialWeight:0.5,experienceWeight:0.05,loyaltyWeight:0.2,riskTolerance:0.8,summary:"Investe em jovens e desenvolvimento de pilotos."},
  ast:{philosophy:"equilibrada",performanceWeight:0.4,potentialWeight:0.25,experienceWeight:0.2,loyaltyWeight:0.15,riskTolerance:0.45,summary:"Combina experiência com potencial de evolução."},
  has:{philosophy:"conservadora",performanceWeight:0.35,potentialWeight:0.2,experienceWeight:0.3,loyaltyWeight:0.15,riskTolerance:0.2,summary:"Prefere estabilidade e decisões de menor risco."},
  aud:{philosophy:"reconstrucao",performanceWeight:0.3,potentialWeight:0.4,experienceWeight:0.1,loyaltyWeight:0.2,riskTolerance:0.65,summary:"Constrói um projeto de longo prazo com potencial."},
  alp:{philosophy:"agressiva",performanceWeight:0.4,potentialWeight:0.35,experienceWeight:0.1,loyaltyWeight:0.15,riskTolerance:0.7,summary:"Procura oportunidades e mudanças para subir no grid."},
  cad:{philosophy:"reconstrucao",performanceWeight:0.25,potentialWeight:0.45,experienceWeight:0.15,loyaltyWeight:0.15,riskTolerance:0.65,summary:"Prioriza construir uma base competitiva para o futuro."},
};

const DEFAULT_PROFILE: TeamDecisionProfile = {philosophy:"equilibrada",performanceWeight:0.4,potentialWeight:0.25,experienceWeight:0.2,loyaltyWeight:0.15,riskTolerance:0.4,summary:"Busca equilíbrio entre desempenho atual e potencial."};
export function getTeamDecisionProfile(teamId: string): TeamDecisionProfile {
  if (PROFILES[teamId]) return PROFILES[teamId];
  const seed = [...teamId].reduce((sum,char)=>sum+char.charCodeAt(0),0)%4;
  const variants: TeamDecisionProfile[] = [
    {...DEFAULT_PROFILE,philosophy:"formadora",performanceWeight:0.25,potentialWeight:0.45,experienceWeight:0.1,loyaltyWeight:0.2,summary:"Valoriza jovens talentos e potencial de evolução."},
    {...DEFAULT_PROFILE,philosophy:"conservadora",performanceWeight:0.35,potentialWeight:0.2,experienceWeight:0.3,loyaltyWeight:0.15,summary:"Prioriza estabilidade e experiência."},
    {...DEFAULT_PROFILE,philosophy:"agressiva",performanceWeight:0.45,potentialWeight:0.35,experienceWeight:0.1,loyaltyWeight:0.1,riskTolerance:0.8,summary:"Aceita riscos em busca de desempenho e talento."},
    DEFAULT_PROFILE,
  ];
  return variants[seed];
}
export function scoreTeamCandidate(input: {teamId:string;points:number;bestPoints:number;potential?:number;age?:number;experience?:number;loyalty?:number}): number {
  const p=getTeamDecisionProfile(input.teamId);
  const performance=input.bestPoints>0?Math.max(0,Math.min(100,input.points/input.bestPoints*100)):0;
  const potential=Math.max(0,Math.min(100,input.potential??60));
  const age=input.age??24;
  const experience=Math.max(0,Math.min(100,input.experience??(age>=25?75:age>=21?55:35)));
  const loyalty=Math.max(0,Math.min(100,input.loyalty??50));
  return performance*p.performanceWeight+potential*p.potentialWeight+experience*p.experienceWeight+loyalty*p.loyaltyWeight;
}
