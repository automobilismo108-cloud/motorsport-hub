"use client";

import { useMemo, useState } from "react";
import { Check, FileSignature, RefreshCw } from "lucide-react";
import { ACTIVE_SEASON, REQUIRED_SUPER_LICENSE_POINTS, getSuperLicensePoints, normalizeLicenseAwards } from "@/lib/superLicense";
import { useCloudState } from "@/lib/useCloudState";

type Driver={id:string;licenseId?:string;name:string;teamId:string;status?:string;isFictional?:boolean};
type Team={id:string;name:string};
type Agreement={id:string;driverId:string;driverName:string;sourceCategory:"F1"|"F2"|"F3";sourceTeam:string;targetCategory:"F1"|"F2"|"F3";targetTeamId:string;targetTeam:string;type:"Pré-contrato"|"Renovação";signedSeason:number;effectiveSeason:number;duration:number;status:"Assinado"|"Concluído"|"Cancelado"};
const KEY="workspace:driver-contracts:v1";
const capacity=(c:string)=>c==="F3"?3:2;

export default function ContractMarket({f1,f2,f3,teams1,teams2,teams3,awards}:{f1:Driver[];f2:Driver[];f3:Driver[];teams1:Team[];teams2:Team[];teams3:Team[];awards:unknown}){
 const [agreements,setAgreements,ready,error]=useCloudState<Agreement[]>(KEY,[]);
 const [category,setCategory]=useState<"F1"|"F2"|"F3">("F1");
 const [driverId,setDriverId]=useState("");
 const [teamId,setTeamId]=useState("");
 const [type,setType]=useState<"Pré-contrato"|"Renovação">("Pré-contrato");
 const [duration,setDuration]=useState(2);
 const [notice,setNotice]=useState("");
 const rosters={F1:f1,F2:f2,F3:f3};
 const teamLists={F1:teams1,F2:teams2,F3:teams3};
 const selected=useMemo(()=>[...f1.map(d=>({...d,category:"F1" as const})),...f2.map(d=>({...d,category:"F2" as const})),...f3.map(d=>({...d,category:"F3" as const}))].find(d=>d.id===driverId),[f1,f2,f3,driverId]);
 const selectedTeam=teamLists[category].find(t=>t.id===teamId);
 const signed=agreements.filter(a=>a.status==="Assinado");
 const submit=()=>{
  if(!selected||!selectedTeam){setNotice("Selecione um piloto e uma equipe.");return;}
  if(type==="Renovação"&&(selected.category!==category||selected.teamId!==teamId)){setNotice("Renovações só podem ser feitas com a equipe atual do piloto e na mesma categoria.");return;}
  if(type==="Pré-contrato"&&selected.category!==category){
   if(selected.isFictional||selected.licenseId?.startsWith("free-agent:")||selected.id.startsWith("free-generated-")){setNotice("Pilotos fictícios precisam conquistar a Superlicença antes de assinar com outra categoria.");return;}
   const points=selected.category==="F1"?REQUIRED_SUPER_LICENSE_POINTS:getSuperLicensePoints(normalizeLicenseAwards(awards),selected.licenseId??"driver:"+selected.id);
   if(points<REQUIRED_SUPER_LICENSE_POINTS){setNotice("Pré-contrato entre categorias exige Superlicença completa (40 pontos). Este piloto tem "+points+" pontos.");return;}
  }
  if(type==="Pré-contrato"&&selected.category==="F1"&&category!=="F1"){setNotice("Rebaixamentos não são permitidos: F1 não pode assinar pré-contrato com equipe de F2 ou F3.");return;}
  const same=signed.find(a=>a.driverId===selected.id);
  if(same){setNotice("Este piloto já possui um acordo assinado para a próxima temporada.");return;}
  const occupied=rosters[category].filter(d=>d.teamId===teamId&&d.status!=="Transferido"&&d.status!=="Aposentado"&&(type!=="Renovação"||d.id!==selected.id)).length;
  const incoming=signed.filter(a=>a.targetCategory===category&&a.targetTeamId===teamId&&a.type==="Pré-contrato").length;
  if(type==="Pré-contrato"&&occupied+incoming>=capacity(category)){setNotice("A equipe já está no limite de vagas considerando os pré-contratos assinados.");return;}
  const agreement:Agreement={id:"contract-"+Date.now(),driverId:selected.id,driverName:selected.name,sourceCategory:selected.category,sourceTeam:teamLists[selected.category].find(t=>t.id===selected.teamId)?.name??"Agente livre",targetCategory:category,targetTeamId:teamId,targetTeam:selectedTeam.name,type,signedSeason:ACTIVE_SEASON,effectiveSeason:ACTIVE_SEASON+1,duration,status:"Assinado"};
  setAgreements(old=>[agreement,...old]);
  setNotice(type==="Renovação"?"Renovação registrada para "+selected.name+".":"Pré-contrato assinado: "+selected.name+" defenderá "+selectedTeam.name+" a partir de "+(ACTIVE_SEASON+1)+".");
  setDriverId("");
 };
 if(error)return <div className="notice">Não foi possível carregar os contratos: {error}</div>;
 if(!ready)return <div className="panel" style={{padding:20}}>Sincronizando contratos...</div>;
 return <div className="market-contracts">
  {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}>×</button></div>}
  <div className="panel table-panel">
   <div className="panel-head"><div><h2>Contratos e pré-contratos</h2><p>Negociações durante a temporada {ACTIVE_SEASON}. Pré-contratos valem a partir de {ACTIVE_SEASON+1}.</p></div><FileSignature size={22}/></div>
   <div className="contract-form-grid">
    <label>TIPO DE ACORDO<select value={type} onChange={e=>setType(e.target.value as typeof type)}><option>Pré-contrato</option><option>Renovação</option></select></label>
    <label>CATEGORIA DA EQUIPE<select value={category} onChange={e=>{setCategory(e.target.value as typeof category);setTeamId("");}}>{(["F1","F2","F3"] as const).map(c=><option key={c}>{c}</option>)}</select></label>
    <label>PILOTO<select value={driverId} onChange={e=>setDriverId(e.target.value)}><option value="">Selecione um piloto</option>{[...f1.map(d=>({...d,category:"F1"})),...f2.map(d=>({...d,category:"F2"})),...f3.map(d=>({...d,category:"F3"}))].filter(d=>d.status!=="Transferido"&&d.status!=="Aposentado").map(d=><option key={d.id} value={d.id}>{d.name} · {d.category}</option>)}</select></label>
    <label>EQUIPE DESTINO<select value={teamId} onChange={e=>setTeamId(e.target.value)}><option value="">Selecione uma equipe</option>{teamLists[category].map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    <label>DURAÇÃO<select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={1}>1 temporada</option><option value={2}>2 temporadas</option><option value={3}>3 temporadas</option></select></label>
   </div>
   <div className="market-note"><FileSignature size={16}/><span>Renovações mantêm o piloto na equipe atual. Pré-contratos só alteram o elenco no início da próxima temporada. Contratações entre categorias exigem Superlicença completa (40 pontos).</span></div>
   <div className="modal-actions"><button className="primary-button" onClick={submit}><Check size={16}/> Registrar acordo assinado</button></div>
  </div>
  <div className="panel table-panel"><div className="panel-head"><div><h2>Acordos registrados</h2><p>{agreements.length} contrato(s) no histórico</p></div><RefreshCw size={18}/></div>
   {agreements.length===0?<div className="paddock-empty">Nenhum contrato assinado nesta temporada.</div>:<div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>ACORDO</th><th>EQUIPE</th><th>VIGÊNCIA</th><th>STATUS</th></tr></thead><tbody>{agreements.map(a=><tr key={a.id}><td><b>{a.driverName}</b><div className="free-agent-origin">{a.sourceCategory} · {a.sourceTeam}</div></td><td>{a.type}</td><td>{a.targetTeam} · {a.targetCategory}</td><td>{a.effectiveSeason}–{a.effectiveSeason+a.duration-1}</td><td><span className="status-tag">{a.status}</span></td></tr>)}</tbody></table></div>}
  </div>
 </div>;
}
