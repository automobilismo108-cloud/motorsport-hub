"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Flag, Plus, Trophy, Medal, ClipboardList, X, Check, Trash2 } from "lucide-react";

type Driver = { id: string; name: string; country: string; number: number; teamId: string; status: "Titular" | "Reserva" };
type Team = { id: string; name: string; color: string; short: string };
type Race = { id: number; round: number; name: string; circuit: string; date: string; status: "Programada" | "Concluída" };
type Result = { id: number; raceId: number; driverId: string; position: number | null; points: number; status: string };

const POINTS = [25,18,15,12,10,8,6,4,2,1];
const initialRaces: Race[] = [
  {id:1,round:1,name:"Etapa 01",circuit:"Circuito a definir",date:"",status:"Programada"},
  {id:2,round:2,name:"Etapa 02",circuit:"Circuito a definir",date:"",status:"Programada"},
  {id:3,round:3,name:"Etapa 03",circuit:"Circuito a definir",date:"",status:"Programada"},
];

export default function Championship({drivers,teams}:{drivers:Driver[];teams:Team[]}) {
  const [tab,setTab]=useState<"classificacao"|"calendario"|"resultados">("classificacao");
  const [races,setRaces]=useState(initialRaces);
  const [results,setResults]=useState<Result[]>([]);
  const [raceId,setRaceId]=useState("1");
  const [driverId,setDriverId]=useState("");
  const [position,setPosition]=useState("1");
  const [resultStatus,setResultStatus]=useState("Classificado");
  const [showRace,setShowRace]=useState(false);
  const [raceName,setRaceName]=useState("");
  const [circuit,setCircuit]=useState("");
  const [raceDate,setRaceDate]=useState("");
  const [notice,setNotice]=useState("");

  const driverName=(id:string)=>drivers.find(d=>d.id===id)?.name??"Piloto removido";
  const teamName=(id:string)=>teams.find(t=>t.id===id)?.name??"Sem equipe";
  const teamColor=(id:string)=>teams.find(t=>t.id===id)?.color??"#8491a2";
  const standings=useMemo(()=>drivers.map(d=>{
    const rows=results.filter(r=>r.driverId===d.id);
    return { ...d, points:rows.reduce((sum,r)=>sum+r.points,0), wins:rows.filter(r=>r.position===1).length, podiums:rows.filter(r=>r.position!==null&&r.position<=3).length, starts:rows.length };
  }).sort((a,b)=>b.points-a.points||b.wins-a.wins||b.podiums-a.podiums),[drivers,results]);
  const teamStandings=useMemo(()=>teams.map(t=>({...t,points:standings.filter(d=>d.teamId===t.id).reduce((s,d)=>s+d.points,0)})).sort((a,b)=>b.points-a.points),[teams,standings]);
  const completedRaces=races.filter(r=>r.status==="Concluída").length;
  const addRace=()=>{
    if(!raceName.trim()||!circuit.trim())return;
    const next=Math.max(0,...races.map(r=>r.round))+1;
    setRaces(old=>[...old,{id:Date.now(),round:next,name:raceName.trim(),circuit:circuit.trim(),date:raceDate,status:"Programada"}]);
    setRaceName("");setCircuit("");setRaceDate("");setShowRace(false);setNotice("Etapa adicionada ao calendário.");
  };
  const addResult=()=>{
    const selected=drivers.find(d=>d.id===driverId);
    if(!selected||!raceId)return;
    if(results.some(r=>r.raceId===Number(raceId)&&r.driverId===driverId)){setNotice("Este piloto já possui resultado nesta etapa.");return;}
    const pos=resultStatus==="Abandono"||resultStatus==="Desclassificado"?null:Number(position);
    const points=pos&&pos<=10?POINTS[pos-1]:0;
    setResults(old=>[...old,{id:Date.now(),raceId:Number(raceId),driverId,position:pos,points,status:resultStatus}]);
    setRaces(old=>old.map(r=>r.id===Number(raceId)?{...r,status:"Concluída"}:r));
    setNotice("Resultado registrado e classificação atualizada.");
    setDriverId("");
  };
  const selectedRace=races.find(r=>r.id===Number(raceId));

  return <div className="championship-module">
    {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    <div className="champ-hero panel"><div className="champ-hero-icon"><Trophy size={23}/></div><div className="champ-hero-copy"><span className="eyebrow">CAMPEONATO ATIVO</span><h2>FIA Formula One World Championship</h2><p>Temporada 2026 · Fórmula 1 · Sistema de pontuação oficial padrão</p></div><div className="champ-progress"><b>{completedRaces.toString().padStart(2,"0")} <span>/ {races.length.toString().padStart(2,"0")}</span></b><small>ETAPAS COM RESULTADO</small></div></div>
    <div className="champ-tabs">
      <button className={tab==="classificacao"?"selected":""} onClick={()=>setTab("classificacao")}><Trophy size={15}/> Classificação</button>
      <button className={tab==="calendario"?"selected":""} onClick={()=>setTab("calendario")}><CalendarDays size={15}/> Calendário</button>
      <button className={tab==="resultados"?"selected":""} onClick={()=>setTab("resultados")}><ClipboardList size={15}/> Resultados</button>
    </div>
    {tab==="classificacao"&&<div className="champ-standings-grid">
      <div className="panel table-panel"><div className="panel-head"><div><h2>Campeonato de pilotos</h2><p>Pontuação acumulada na temporada</p></div><span className="status-tag">PILOTOS</span></div><div className="table-wrap"><table><thead><tr><th>POS.</th><th>PILOTO</th><th>EQUIPE</th><th>VITÓRIAS</th><th>PÓDIOS</th><th>PTS</th></tr></thead><tbody>{standings.map((d,i)=><tr key={d.id}><td><b className="champ-position">{String(i+1).padStart(2,"0")}</b></td><td><b>{d.name}</b></td><td><span className="team-cell"><i style={{background:teamColor(d.teamId)}}/>{teamName(d.teamId)}</span></td><td>{d.wins}</td><td>{d.podiums}</td><td><b className="champ-points">{d.points}</b></td></tr>)}</tbody></table></div></div>
      <div className="panel table-panel"><div className="panel-head"><div><h2>Campeonato de construtores</h2><p>Soma dos pontos dos pilotos</p></div><span className="status-tag">EQUIPES</span></div><div className="constructor-list">{teamStandings.map((t,i)=><div className="constructor-row" key={t.id}><b className="champ-position">{String(i+1).padStart(2,"0")}</b><i style={{background:t.color}}/><span>{t.name}</span><strong>{t.points} <small>PTS</small></strong></div>)}</div></div>
    </div>}
    {tab==="calendario"&&<div className="panel table-panel"><div className="panel-head"><div><h2>Calendário da temporada</h2><p>Cadastre as etapas e acompanhe seu andamento. Datas e circuitos iniciais são editáveis.</p></div><button className="primary-button compact" onClick={()=>setShowRace(v=>!v)}><Plus size={15}/> Nova etapa</button></div>
      {showRace&&<div className="race-form"><label>ETAPA<input value={raceName} onChange={e=>setRaceName(e.target.value)} placeholder="Ex.: GP de São Paulo"/></label><label>CIRCUITO<input value={circuit} onChange={e=>setCircuit(e.target.value)} placeholder="Nome do circuito"/></label><label>DATA<input type="date" value={raceDate} onChange={e=>setRaceDate(e.target.value)}/></label><button className="primary-button compact" disabled={!raceName.trim()||!circuit.trim()} onClick={addRace}><Check size={15}/> Adicionar</button></div>}
      <div className="table-wrap"><table><thead><tr><th>RODADA</th><th>GRANDE PRÊMIO</th><th>CIRCUITO</th><th>DATA</th><th>STATUS</th></tr></thead><tbody>{races.slice().sort((a,b)=>a.round-b.round).map(r=><tr key={r.id}><td><b>R{String(r.round).padStart(2,"0")}</b></td><td><b>{r.name}</b></td><td>{r.circuit}</td><td>{r.date||"A definir"}</td><td><span className={r.status==="Concluída"?"status-tag":"race-pending"}>{r.status}</span></td></tr>)}</tbody></table></div>
      <div className="market-note"><Flag size={15}/><span>As três etapas iniciais são espaços demonstrativos, não um calendário oficial. Cadastre os GPs e datas da temporada que deseja acompanhar.</span></div>
    </div>}
    {tab==="resultados"&&<div className="champ-results-grid">
      <div className="panel result-entry"><div className="panel-head"><div><h2>Registrar resultado</h2><p>Informe a chegada de cada piloto para atualizar os pontos.</p></div></div><div className="result-fields"><label>ETAPA<select value={raceId} onChange={e=>setRaceId(e.target.value)}>{races.map(r=><option key={r.id} value={r.id}>{r.name} — {r.circuit}</option>)}</select></label><label>PILOTO<select value={driverId} onChange={e=>setDriverId(e.target.value)}><option value="">Selecione o piloto</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.name} · {teamName(d.teamId)}</option>)}</select></label><div className="result-two"><label>POSIÇÃO<select value={position} onChange={e=>setPosition(e.target.value)}>{Array.from({length:22},(_,i)=><option key={i+1} value={i+1}>{i+1}º</option>)}</select></label><label>SITUAÇÃO<select value={resultStatus} onChange={e=>setResultStatus(e.target.value)}><option>Classificado</option><option>Abandono</option><option>Desclassificado</option></select></label></div><div className="points-preview">PONTOS PREVISTOS <b>{resultStatus==="Classificado"&&Number(position)<=10?POINTS[Number(position)-1]:0} PTS</b></div><button className="primary-button" disabled={!driverId||!selectedRace} onClick={addResult}><Check size={16}/> Registrar resultado</button></div></div>
      <div className="panel table-panel"><div className="panel-head"><div><h2>Últimos resultados</h2><p>Registros lançados nesta demonstração</p></div></div><div className="table-wrap"><table><thead><tr><th>ETAPA</th><th>PILOTO</th><th>POS.</th><th>PTS</th></tr></thead><tbody>{results.length===0?<tr><td colSpan={4} className="empty-state">Nenhum resultado registrado ainda.</td></tr>:results.slice().reverse().map(r=><tr key={r.id}><td>{races.find(x=>x.id===r.raceId)?.name??"Etapa"}</td><td><b>{driverName(r.driverId)}</b></td><td>{r.position? r.position+"º":r.status}</td><td><b className="champ-points">{r.points}</b></td></tr>)}</tbody></table></div></div>
    </div>}
    <div className="champ-footnote"><Medal size={14}/> Pontuação padrão da corrida: 25–18–15–12–10–8–6–4–2–1. Sem ponto extra por volta mais rápida. Dados e resultados são locais neste protótipo e não representam resultados oficiais.</div>
  </div>;
}
