"use client";

import { useEffect } from "react";
import { Activity, FileSignature, RefreshCw } from "lucide-react";
import { ACTIVE_SEASON, REQUIRED_SUPER_LICENSE_POINTS, getSuperLicensePoints, normalizeLicenseAwards } from "@/lib/superLicense";
import { useCloudState } from "@/lib/useCloudState";
import { getTeamDecisionProfile, scoreTeamCandidate, getTeamSeasonAssessment } from "@/lib/teamIntelligence";
import type { DriverDevelopmentState } from "@/lib/driverDevelopment";

type Driver={id:string;licenseId?:string;name:string;teamId:string;status?:string;isFictional?:boolean};
type Team={id:string;name:string};
type Race={id:number;round:number;name:string;status:string};
type Result={id:number;raceId:number;driverId:string;position:number|null;points:number;status:string;session?:string};
type Agreement={id:string;eventKey:string;driverId:string;driverName:string;sourceCategory:"F1"|"F2"|"F3";sourceTeam:string;targetCategory:"F1"|"F2"|"F3";targetTeamId:string;targetTeam:string;type:"Pré-contrato"|"Renovação";signedSeason:number;effectiveSeason:number;duration:number;status:"Assinado"|"Concluído"|"Cancelado";reason:string};
const KEY="workspace:driver-contracts:v1";
const active=(d:Driver)=>d.status!=="Transferido"&&d.status!=="Aposentado";

export default function ContractMarket({f1,f2,f3,freeAgents,teams1,teams2,teams3,awards,development,onFreeAgentSigned}:{f1:Driver[];f2:Driver[];f3:Driver[];freeAgents:Driver[];teams1:Team[];teams2:Team[];teams3:Team[];awards:unknown;development:DriverDevelopmentState;onFreeAgentSigned:(ids:string[])=>void}){
 const [agreements,setAgreements,ready,error]=useCloudState<Agreement[]>(KEY,[]);
 const [r1,,r1Ready,e1]=useCloudState<Race[]>(`championship:f1:${ACTIVE_SEASON}:races`,[]);
 const [x1,,x1Ready,xe1]=useCloudState<Result[]>(`championship:f1:${ACTIVE_SEASON}:results`,[]);
 const [r2,,r2Ready,e2]=useCloudState<Race[]>(`championship:f2:${ACTIVE_SEASON}:races`,[]);
 const [x2,,x2Ready,xe2]=useCloudState<Result[]>(`championship:f2:${ACTIVE_SEASON}:results`,[]);
 const [r3,,r3Ready,e3]=useCloudState<Race[]>(`championship:f3:${ACTIVE_SEASON}:races`,[]);
 const [x3,,x3Ready,xe3]=useCloudState<Result[]>(`championship:f3:${ACTIVE_SEASON}:results`,[]);
 useEffect(()=>{
  if(!ready||!r1Ready||!x1Ready||!r2Ready||!x2Ready||!r3Ready||!x3Ready||error||e1||xe1||e2||xe2||e3||xe3)return;
  const current=[...agreements];
  const add:Agreement[]=[];
  const sets=[
   {category:"F1" as const,drivers:f1.filter(active),teams:teams1,races:r1,results:x1},
   {category:"F2" as const,drivers:f2.filter(active),teams:teams2,races:r2,results:x2},
   {category:"F3" as const,drivers:f3.filter(active),teams:teams3,races:r3,results:x3}
  ];
  const points=(driverId:string,rows:Result[])=>rows.filter(r=>r.driverId===driverId).reduce((sum,r)=>sum+r.points,0);
  const already=(driverId:string)=>current.some(a=>a.driverId===driverId&&a.status==="Assinado")||add.some(a=>a.driverId===driverId);
  const make=(driver:Driver,source:"F1"|"F2"|"F3",target:"F1"|"F2"|"F3",team:Team,type:"Pré-contrato"|"Renovação",key:string,reason:string)=>{
   add.push({id:key,eventKey:key,driverId:driver.id,driverName:driver.name,sourceCategory:source,sourceTeam:sets.find(s=>s.category===source)?.teams.find(t=>t.id===driver.teamId)?.name??"Agente livre",targetCategory:target,targetTeamId:team.id,targetTeam:team.name,type,signedSeason:ACTIVE_SEASON,effectiveSeason:ACTIVE_SEASON+1,duration:2,status:"Assinado",reason});
  };
  // A cada quarta etapa concluída, as equipes avaliam automaticamente seus titulares.
  for(const set of sets){
   for(const race of set.races.filter(r=>r.status==="Concluída"&&r.round%4===0)){
    const eventKey="auto-renew-"+set.category+"-"+race.id;
    if(current.some(a=>a.eventKey.startsWith(eventKey))||add.some(a=>a.eventKey.startsWith(eventKey)))continue;
    for(const team of set.teams){
     const candidates=set.drivers.filter(d=>d.teamId===team.id&&!already(d.id)).sort((a,b)=>points(b.id,set.results)-points(a.id,set.results));
     const best=candidates[0];
     if(best&&points(best.id,set.results)>0){
      make(best,set.category,set.category,team,"Renovação",eventKey+"-"+best.id,"A equipe decidiu manter seu piloto de melhor desempenho após a avaliação intermediária da temporada.");
     }
    }
   }
  }
  // Em marcos de meio/fim de temporada, as equipes de cima buscam talentos da categoria imediatamente inferior.
  for(const [lower,upper,lowerRows,upperRows,lowerTeams,upperTeams] of [
   ["F2","F1",x2,x1,teams2,teams1],
   ["F3","F2",x3,x2,teams3,teams2]
  ] as const){
   const lowerSet=sets.find(s=>s.category===lower)!;
   const upperSet=sets.find(s=>s.category===upper)!;
   for(const race of lowerSet.races.filter(r=>r.status==="Concluída"&&r.round%6===0)){
    const eventKey="auto-promotion-"+lower+"-"+race.id;
    if(current.some(a=>a.eventKey===eventKey)||add.some(a=>a.eventKey===eventKey))continue;
    const eligible=lowerSet.drivers.filter(d=>!already(d.id)&&!d.isFictional&&!d.id.startsWith("free-generated-")&&!d.licenseId?.startsWith("free-agent:")&&getSuperLicensePoints(normalizeLicenseAwards(awards),d.licenseId??"driver:"+d.id)>=REQUIRED_SUPER_LICENSE_POINTS).sort((a,b)=>points(b.id,lowerRows)-points(a.id,lowerRows));
    const prospect=eligible[0];
    if(!prospect||points(prospect.id,lowerRows)<=0)continue;
    const destination=upperTeams.map(team=>({team,weakest:upperSet.drivers.filter(d=>d.teamId===team.id).sort((a,b)=>points(a.id,upperRows)-points(b.id,upperRows))[0]})).filter(x=>x.weakest&&!already(x.weakest.id)).sort((a,b)=>points(a.weakest!.id,upperRows)-points(b.weakest!.id,upperRows))[0];
    if(destination)make(prospect,lower,upper,destination.team,"Pré-contrato",eventKey+"-"+prospect.id,"A equipe identificou potencial de promoção. A Superlicença completa foi validada automaticamente.");
   }
  }
  // Pré-contratos automáticos: equipes podem contratar pilotos da mesma categoria,
  // promover pilotos da categoria imediatamente inferior ou contratar agentes livres.
  const freeSigned:string[]=[];
  for(const [targetCategory,sourceCategory] of [["F1","F2"],["F2","F3"],["F3",null]] as const){
   const targetSet=sets.find(s=>s.category===targetCategory)!;
   const lowerSet=sourceCategory?sets.find(s=>s.category===sourceCategory)!:null;
   const triggerRaces=targetSet.races.filter(r=>r.status==="Concluída"&&r.round%6===0);
   for(const race of triggerRaces){
    const eventKey="auto-open-market-"+targetCategory+"-"+race.id;
    if(current.some(a=>a.eventKey.startsWith(eventKey))||add.some(a=>a.eventKey.startsWith(eventKey)))continue;
    const capacity=targetCategory==="F3"?3:2;
    for(const team of targetSet.teams){
     const committed=current.filter(a=>a.targetCategory===targetCategory&&a.targetTeamId===team.id&&a.status==="Assinado"&&a.effectiveSeason===ACTIVE_SEASON+1).length
      +add.filter(a=>a.targetCategory===targetCategory&&a.targetTeamId===team.id&&a.status==="Assinado"&&a.effectiveSeason===ACTIVE_SEASON+1).length;
     const currentCount=targetSet.drivers.filter(d=>d.teamId===team.id).length;
     if(currentCount+committed>=capacity)continue;
     const sameCategory=targetSet.drivers.filter(d=>d.teamId!==team.id&&!already(d.id)&&!d.isFictional).sort((a,b)=>scoreTeamCandidate({teamId:team.id,points:points(b.id,targetSet.results),bestPoints:Math.max(1,...targetSet.drivers.map(x=>points(x.id,targetSet.results))),...(development[b.licenseId??b.id]?{potential:development[b.licenseId??b.id].potential,age:development[b.licenseId??b.id].age,attributes:development[b.licenseId??b.id].attributes}:{})})-scoreTeamCandidate({teamId:team.id,points:points(a.id,targetSet.results),bestPoints:Math.max(1,...targetSet.drivers.map(x=>points(x.id,targetSet.results))),...(development[a.licenseId??a.id]?{potential:development[a.licenseId??a.id].potential,age:development[a.licenseId??a.id].age,attributes:development[a.licenseId??a.id].attributes}:{})}));
     const promotionCandidates=lowerSet?lowerSet.drivers.filter(d=>!already(d.id)&&!d.isFictional&&
      (targetCategory!=="F1"||getSuperLicensePoints(normalizeLicenseAwards(awards),d.licenseId??"driver:"+d.id)>=REQUIRED_SUPER_LICENSE_POINTS))
      .sort((a,b)=>scoreTeamCandidate({teamId:team.id,points:points(b.id,lowerSet.results),bestPoints:Math.max(1,...lowerSet.drivers.map(x=>points(x.id,lowerSet.results))),...(development[b.licenseId??b.id]?{potential:development[b.licenseId??b.id].potential,age:development[b.licenseId??b.id].age,attributes:development[b.licenseId??b.id].attributes}:{})})-scoreTeamCandidate({teamId:team.id,points:points(a.id,lowerSet.results),bestPoints:Math.max(1,...lowerSet.drivers.map(x=>points(x.id,lowerSet.results))),...(development[a.licenseId??a.id]?{potential:development[a.licenseId??a.id].potential,age:development[a.licenseId??a.id].age,attributes:development[a.licenseId??a.id].attributes}:{})})):[];
     const freeCandidates=freeAgents.filter(d=>!freeSigned.includes(d.id)&&!already(d.id)&&
      (targetCategory!=="F1"||getSuperLicensePoints(normalizeLicenseAwards(awards),d.licenseId??"driver:"+d.id)>=REQUIRED_SUPER_LICENSE_POINTS));
     const chosen=sameCategory.find(d=>points(d.id,targetSet.results)>0)
      ??promotionCandidates.find(d=>points(d.id,lowerSet!.results)>0)
      ??freeCandidates[0];
     if(!chosen)continue;
     const source=freeCandidates.includes(chosen)?targetCategory:(promotionCandidates.includes(chosen)?sourceCategory!:targetCategory);
     const sourceTeam=source===targetCategory?targetSet.teams.find(t=>t.id===chosen.teamId)?.name??"Agente livre":lowerSet?.teams.find(t=>t.id===chosen.teamId)?.name??"Agente livre";
     add.push({id:eventKey+"-"+chosen.id,eventKey:eventKey+"-"+chosen.id,driverId:chosen.id,driverName:chosen.name,sourceCategory:source,sourceTeam,targetCategory,targetTeamId:team.id,targetTeam:team.name,type:"Pré-contrato",signedSeason:ACTIVE_SEASON,effectiveSeason:ACTIVE_SEASON+1,duration:2,status:"Assinado",reason:source===targetCategory?"Acordo automático com piloto da mesma categoria.":sourceCategory?"Pré-contrato automático para promoção à categoria imediatamente superior.":"Agente livre contratado automaticamente para a próxima temporada."});
     if(freeCandidates.includes(chosen))freeSigned.push(chosen.id);
    }
   }
  }
  if(freeSigned.length)onFreeAgentSigned(freeSigned);
  if(add.length)setAgreements(old=>{const keys=new Set(old.map(a=>a.eventKey));const fresh=add.filter(a=>!keys.has(a.eventKey));return fresh.length?[...old,...fresh]:old;});
 },[ready,r1Ready,x1Ready,r2Ready,x2Ready,r3Ready,x3Ready,error,e1,xe1,e2,xe2,e3,xe3,agreements,r1,x1,r2,x2,r3,x3,f1,f2,f3,freeAgents,teams1,teams2,teams3,awards,onFreeAgentSigned,setAgreements]);
 if(error||e1||xe1||e2||xe2||e3||xe3)return <div className="notice">Não foi possível sincronizar o mercado automático de contratos. Os dados existentes foram preservados.</div>;
 if(!ready||!r1Ready||!x1Ready||!r2Ready||!x2Ready||!r3Ready||!x3Ready)return <div className="panel" style={{padding:20}}>Sincronizando decisões automáticas das equipes...</div>;
 const ordered=[...agreements].sort((a,b)=>b.signedSeason-a.signedSeason||b.effectiveSeason-a.effectiveSeason);
 const roster=[
  ...f1.filter(active).map(d=>({...d,category:"F1" as const,teamName:teams1.find(t=>t.id===d.teamId)?.name??"Equipe não identificada"})),
  ...f2.filter(active).map(d=>({...d,category:"F2" as const,teamName:teams2.find(t=>t.id===d.teamId)?.name??"Equipe não identificada"})),
  ...f3.filter(active).map(d=>({...d,category:"F3" as const,teamName:teams3.find(t=>t.id===d.teamId)?.name??"Equipe não identificada"}))
 ].sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
 const latestAgreement=(driverId:string)=>ordered.find(a=>a.driverId===driverId&&a.status==="Assinado");
 const covered=roster.filter(d=>latestAgreement(d.id)).length;
 const withoutAgreement=roster.length-covered;

 return <div className="market-contracts">
  <div className="panel table-panel">
   <div className="panel-head"><div><h2>Mercado automático de contratos</h2><p>Equipes e pilotos negociam sem intervenção. As decisões são avaliadas conforme os resultados de F1, F2 e F3.</p></div><Activity size={22}/></div>
   <div className="market-note"><FileSignature size={16}/><span>Renovações e pré-contratos são gerados automaticamente em marcos da temporada. Acordos valem a partir de {ACTIVE_SEASON+1}, duram 2 temporadas e respeitam as vagas futuras. F1 aceita pilotos de F1 ou promovidos da F2 com Superlicença completa; F2 aceita pilotos de F2, promovidos da F3 e agentes livres; F3 aceita pilotos da F3 e agentes livres.</span></div>
   <div className="contract-auto-status"><span className="status-tag">AUTOMAÇÃO ATIVA</span><span>{ordered.length} acordo(s) no histórico</span><RefreshCw size={16}/></div>
  </div>
  <section className="contract-dashboard">
   <div className="contract-dashboard-heading"><div><h2>Painel de contratos</h2><p>Visão geral dos vínculos registrados para os pilotos ativos das três categorias.</p></div><span>{roster.length} pilotos ativos</span></div>
   <div className="contract-summary-grid">
    <div className="contract-summary-card"><span>PILOTOS ATIVOS</span><strong>{roster.length}</strong></div>
    <div className="contract-summary-card"><span>ACORDOS REGISTRADOS</span><strong>{covered}</strong></div>
    <div className="contract-summary-card"><span>SEM ACORDO REGISTRADO</span><strong>{withoutAgreement}</strong></div>
   </div>
   <div className="panel table-panel contract-roster-panel">
    <div className="panel-head"><div><h2>Situação contratual por piloto</h2><p>Os prazos exibidos correspondem aos acordos salvos no sistema. Contratos anteriores ainda não cadastrados aparecem como não informados.</p></div><FileSignature size={18}/></div>
    <div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>CATEGORIA</th><th>EQUIPE ATUAL</th><th>SITUAÇÃO</th><th>VIGÊNCIA REGISTRADA</th></tr></thead><tbody>
     {roster.map(d=>{const agreement=latestAgreement(d.id);return <tr key={d.category+"-"+d.id}><td><b>{d.name}</b></td><td>{d.category}</td><td>{d.teamName}</td><td>{agreement?<span className="status-tag">{agreement.type==="Renovação"?"Renovação assinada":"Pré-contrato assinado"}</span>:<span className="contract-no-record">Sem acordo registrado</span>}</td><td>{agreement?agreement.effectiveSeason+"–"+(agreement.effectiveSeason+agreement.duration-1):"Não informada"}</td></tr>;})}
    </tbody></table></div>
   </div>
  </section>
  <section className="contract-dashboard"><div className="contract-dashboard-heading"><div><h2>Inteligência e objetivos das equipes</h2><p>Metas, desempenho acumulado e alertas calculados automaticamente.</p></div><span>Temporada {ACTIVE_SEASON}</span></div><div className="team-intelligence-grid">{[...teams1.map(t=>({...t,category:"F1" as const,drivers:f1,results:x1,races:r1})),...teams2.map(t=>({...t,category:"F2" as const,drivers:f2,results:x2,races:r2})),...teams3.map(t=>({...t,category:"F3" as const,drivers:f3,results:x3,races:r3}))].map(team=>{const assessment=getTeamSeasonAssessment({teamId:team.id,teamName:team.name,category:team.category,drivers:team.drivers.filter(d=>d.teamId===team.id&&active(d)),results:team.results,development,roundsCompleted:team.races.filter(r=>r.status==="Concluída").length,season:ACTIVE_SEASON});return <article className="team-intelligence-card" key={team.category+"-"+team.id}><div><b>{team.name}</b><span className="status-tag">{team.category} · {assessment.philosophy}</span></div><p>{assessment.goal}</p><small>{assessment.points} pontos · {assessment.driverAverage===null?"Atributos não cadastrados": "Média dos pilotos "+assessment.driverAverage+"/100"}</small>{assessment.alert&&<strong className="contract-no-record">{assessment.alert}</strong>}<small>{assessment.summary}</small></article>;})}</div></section>
  <div className="panel table-panel"><div className="panel-head"><div><h2>Decisões das equipes</h2><p>Contratos, renovações e pré-contratos assinados automaticamente</p></div><FileSignature size={18}/></div>
   {!ordered.length?<div className="paddock-empty">Nenhuma decisão contratual ainda. O sistema avaliará o mercado conforme as etapas forem concluídas.</div>:<div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>ACORDO</th><th>EQUIPE</th><th>VIGÊNCIA</th><th>STATUS</th></tr></thead><tbody>{ordered.map(a=><tr key={a.eventKey}><td><b>{a.driverName}</b><div className="free-agent-origin">{a.sourceCategory} · {a.sourceTeam}</div></td><td>{a.type}<div className="free-agent-origin">{a.reason}</div></td><td>{a.targetTeam} · {a.targetCategory}</td><td>{a.effectiveSeason}–{a.effectiveSeason+a.duration-1}</td><td><span className="status-tag">{a.status}</span></td></tr>)}</tbody></table></div>}
  </div>
 </div>;
}
