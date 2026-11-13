"use client";

import { useEffect } from "react";
import { Activity, FileSignature, RefreshCw } from "lucide-react";
import { ACTIVE_SEASON, REQUIRED_SUPER_LICENSE_POINTS, getSuperLicensePoints, normalizeLicenseAwards } from "@/lib/superLicense";
import { useCloudState } from "@/lib/useCloudState";

type Driver={id:string;licenseId?:string;name:string;teamId:string;status?:string;isFictional?:boolean};
type Team={id:string;name:string};
type Race={id:number;round:number;name:string;status:string};
type Result={id:number;raceId:number;driverId:string;position:number|null;points:number;status:string;session?:string};
type Agreement={id:string;eventKey:string;driverId:string;driverName:string;sourceCategory:"F1"|"F2"|"F3";sourceTeam:string;targetCategory:"F1"|"F2"|"F3";targetTeamId:string;targetTeam:string;type:"Pré-contrato"|"Renovação";signedSeason:number;effectiveSeason:number;duration:number;status:"Assinado"|"Concluído"|"Cancelado";reason:string};
const KEY="workspace:driver-contracts:v1";
const active=(d:Driver)=>d.status!=="Transferido"&&d.status!=="Aposentado";

export default function ContractMarket({f1,f2,f3,teams1,teams2,teams3,awards}:{f1:Driver[];f2:Driver[];f3:Driver[];teams1:Team[];teams2:Team[];teams3:Team[];awards:unknown}){
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
    if(current.some(a=>a.eventKey===eventKey)||add.some(a=>a.eventKey===eventKey))continue;
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
  if(add.length)setAgreements(old=>{const keys=new Set(old.map(a=>a.eventKey));const fresh=add.filter(a=>!keys.has(a.eventKey));return fresh.length?[...old,...fresh]:old;});
 },[ready,r1Ready,x1Ready,r2Ready,x2Ready,r3Ready,x3Ready,error,e1,xe1,e2,xe2,e3,xe3,agreements,r1,x1,r2,x2,r3,x3,f1,f2,f3,teams1,teams2,teams3,awards,setAgreements]);
 if(error||e1||xe1||e2||xe2||e3||xe3)return <div className="notice">Não foi possível sincronizar o mercado automático de contratos. Os dados existentes foram preservados.</div>;
 if(!ready||!r1Ready||!x1Ready||!r2Ready||!x2Ready||!r3Ready||!x3Ready)return <div className="panel" style={{padding:20}}>Sincronizando decisões automáticas das equipes...</div>;
 const ordered=[...agreements].sort((a,b)=>b.signedSeason-a.signedSeason||b.effectiveSeason-a.effectiveSeason);
 return <div className="market-contracts">
  <div className="panel table-panel">
   <div className="panel-head"><div><h2>Mercado automático de contratos</h2><p>Equipes e pilotos negociam sem intervenção. As decisões são avaliadas conforme os resultados de F1, F2 e F3.</p></div><Activity size={22}/></div>
   <div className="market-note"><FileSignature size={16}/><span>Renovações e pré-contratos são gerados automaticamente em marcos da temporada. Acordos valem a partir de {ACTIVE_SEASON+1}, duram 2 temporadas e ficam sujeitos à capacidade das equipes. Promoções entre categorias exigem Superlicença completa (40 pontos).</span></div>
   <div className="contract-auto-status"><span className="status-tag">AUTOMAÇÃO ATIVA</span><span>{ordered.length} acordo(s) no histórico</span><RefreshCw size={16}/></div>
  </div>
  <div className="panel table-panel"><div className="panel-head"><div><h2>Decisões das equipes</h2><p>Contratos, renovações e pré-contratos assinados automaticamente</p></div><FileSignature size={18}/></div>
   {!ordered.length?<div className="paddock-empty">Nenhuma decisão contratual ainda. O sistema avaliará o mercado conforme as etapas forem concluídas.</div>:<div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>ACORDO</th><th>EQUIPE</th><th>VIGÊNCIA</th><th>STATUS</th></tr></thead><tbody>{ordered.map(a=><tr key={a.eventKey}><td><b>{a.driverName}</b><div className="free-agent-origin">{a.sourceCategory} · {a.sourceTeam}</div></td><td>{a.type}<div className="free-agent-origin">{a.reason}</div></td><td>{a.targetTeam} · {a.targetCategory}</td><td>{a.effectiveSeason}–{a.effectiveSeason+a.duration-1}</td><td><span className="status-tag">{a.status}</span></td></tr>)}</tbody></table></div>}
  </div>
 </div>;
}
