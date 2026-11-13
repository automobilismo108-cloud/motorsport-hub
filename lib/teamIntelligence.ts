import type { DriverDevelopmentState, DriverAttributes } from "@/lib/driverDevelopment";
export type TeamPhilosophy = "vencedora" | "formadora" | "conservadora" | "agressiva" | "reconstrucao" | "equilibrada";
export type TeamDecisionProfile = { philosophy: TeamPhilosophy; performanceWeight: number; potentialWeight: number; experienceWeight: number; loyaltyWeight: number; riskTolerance: number; summary: string };
const PROFILES: Record<string, TeamDecisionProfile> = {
mcl:{philosophy:"vencedora",performanceWeight:.55,potentialWeight:.2,experienceWeight:.15,loyaltyWeight:.1,riskTolerance:.45,summary:"Prioriza resultados imediatos e pilotos completos."},
mer:{philosophy:"equilibrada",performanceWeight:.4,potentialWeight:.25,experienceWeight:.2,loyaltyWeight:.15,riskTolerance:.4,summary:"Busca equilíbrio entre velocidade, experiência e futuro."},
red:{philosophy:"agressiva",performanceWeight:.45,potentialWeight:.35,experienceWeight:.1,loyaltyWeight:.1,riskTolerance:.8,summary:"Aceita riscos e aposta alto em talento e desempenho."},
fer:{philosophy:"vencedora",performanceWeight:.5,potentialWeight:.2,experienceWeight:.2,loyaltyWeight:.1,riskTolerance:.35,summary:"Exige desempenho e experiência para disputar títulos."},
wil:{philosophy:"formadora",performanceWeight:.25,potentialWeight:.45,experienceWeight:.1,loyaltyWeight:.2,riskTolerance:.7,summary:"Valoriza jovens talentos e crescimento de longo prazo."},
rb:{philosophy:"formadora",performanceWeight:.25,potentialWeight:.5,experienceWeight:.05,loyaltyWeight:.2,riskTolerance:.8,summary:"Investe em jovens e desenvolvimento de pilotos."},
ast:{philosophy:"equilibrada",performanceWeight:.4,potentialWeight:.25,experienceWeight:.2,loyaltyWeight:.15,riskTolerance:.45,summary:"Combina experiência com potencial de evolução."},
has:{philosophy:"conservadora",performanceWeight:.35,potentialWeight:.2,experienceWeight:.3,loyaltyWeight:.15,riskTolerance:.2,summary:"Prefere estabilidade e decisões de menor risco."},
aud:{philosophy:"reconstrucao",performanceWeight:.3,potentialWeight:.4,experienceWeight:.1,loyaltyWeight:.2,riskTolerance:.65,summary:"Constrói um projeto de longo prazo com potencial."},
alp:{philosophy:"agressiva",performanceWeight:.4,potentialWeight:.35,experienceWeight:.1,loyaltyWeight:.15,riskTolerance:.7,summary:"Procura oportunidades e mudanças para subir no grid."},
cad:{philosophy:"reconstrucao",performanceWeight:.25,potentialWeight:.45,experienceWeight:.15,loyaltyWeight:.15,riskTolerance:.65,summary:"Prioriza construir uma base competitiva para o futuro."}};
const DEFAULT_PROFILE:TeamDecisionProfile={philosophy:"equilibrada",performanceWeight:.4,potentialWeight:.25,experienceWeight:.2,loyaltyWeight:.15,riskTolerance:.4,summary:"Busca equilíbrio entre desempenho atual e potencial."};
export function getTeamDecisionProfile(teamId:string):TeamDecisionProfile{return PROFILES[teamId]??DEFAULT_PROFILE;}
export function scoreTeamCandidate(input:{teamId:string;points:number;bestPoints:number;potential?:number;age?:number;experience?:number;loyalty?:number;attributes?:DriverAttributes}):number{
 const p=getTeamDecisionProfile(input.teamId),performance=input.bestPoints>0?Math.max(0,Math.min(100,input.points/input.bestPoints*100)):0;
 const attrs=input.attributes,overall=attrs?(attrs.racePace+attrs.qualifying+attrs.overtaking+attrs.defending+attrs.consistency)/5:60;
 const potential=Math.max(0,Math.min(100,input.potential??overall)),age=input.age??24;
 const experience=Math.max(0,Math.min(100,input.experience??(age>=25?75:age>=21?55:35)));
 const loyalty=Math.max(0,Math.min(100,input.loyalty??50));
 return performance*p.performanceWeight+potential*p.potentialWeight+experience*p.experienceWeight+loyalty*p.loyaltyWeight;
}
export function getTeamSeasonAssessment(input:{teamId:string;teamName:string;category:"F1"|"F2"|"F3";drivers:Array<{id:string;licenseId?:string;name:string}>;results:Array<{driverId:string;points:number}>;development:DriverDevelopmentState;roundsCompleted:number;season:number}){
 const profile=getTeamDecisionProfile(input.teamId),ids=new Set(input.drivers.map(d=>d.id));
 const points=input.results.filter(r=>ids.has(r.driverId)).reduce((s,r)=>s+(Number(r.points)||0),0);
 const rounds=Math.max(1,input.roundsCompleted),averagePerRound=points/rounds;
 const records=input.drivers.map(d=>input.development[d.licenseId??d.id]??input.development[d.id]).filter(Boolean) as Array<DriverDevelopmentState[string]>;
 const ratings=records.map(record=>(record.attributes.racePace+record.attributes.qualifying+record.attributes.overtaking+record.attributes.defending+record.attributes.consistency)/5);
 const averageAge=records.length?records.reduce((sum,record)=>sum+record.age,0)/records.length:null;
 const overall=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:null;
 const goal=profile.philosophy==="vencedora"?"Disputar vitórias e títulos":profile.philosophy==="formadora"?"Desenvolver jovens talentos":profile.philosophy==="reconstrucao"?"Construir uma base competitiva":profile.philosophy==="conservadora"?"Manter estabilidade e consistência":profile.philosophy==="agressiva"?"Buscar evolução e oportunidades": "Equilibrar resultados e desenvolvimento";
 const expected=input.category==="F1"?(profile.philosophy==="vencedora"?18:10):input.category==="F2"?12:8;
 const crisis=rounds>=4&&averagePerRound<expected*0.35;
 const alert=crisis?"Pressão por resultados: desempenho abaixo da meta":input.drivers.length===0?"Sem pilotos titulares cadastrados":null;
 const strategicFocus=crisis?(profile.riskTolerance>=.65?"Aumentar a aposta em jovens talentos e oportunidades no mercado":"Priorizar estabilidade e recuperar consistência"):(averageAge!==null&&averageAge<23?"Investir em desenvolvimento e continuidade do grupo":averageAge!==null&&averageAge>=32?"Planejar renovação gradual do elenco":profile.philosophy==="vencedora"?"Manter competitividade e buscar desempenho imediato":profile.philosophy==="formadora"?"Dar prioridade à evolução dos pilotos":"Manter equilíbrio entre resultados e desenvolvimento");
 return {goal,crisis,alert,points,averagePerRound:Number(averagePerRound.toFixed(1)),driverAverage:overall===null?null:Number(overall.toFixed(1)),averageAge:averageAge===null?null:Number(averageAge.toFixed(1)),strategicFocus,philosophy:profile.philosophy,summary:profile.summary,riskTolerance:profile.riskTolerance};
}
