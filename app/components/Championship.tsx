"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Flag, Plus, Trophy, Medal, ClipboardList, X, Check, Trash2 } from "lucide-react";

type Driver = { id: string; name: string; country: string; number: number; teamId: string; status: "Titular" | "Reserva" };
type Team = { id: string; name: string; color: string; short: string };
type Race = { id: number; round: number; name: string; circuit: string; date: string; status: "Programada" | "Concluída" };
type Result = { id: number; raceId: number; driverId: string; position: number | null; points: number; status: string };

const POINTS = [25,18,15,12,10,8,6,4,2,1];
// Calendário original oficial de 24 etapas anunciado pela FIA/F1 para 2026.
 // Bahrain e Arábia Saudita permanecem na lista a pedido do usuário, mesmo após os cancelamentos.
const initialRaces: Race[] = [
  {id:1,round:1,name:"GP da Austrália",circuit:"Albert Park — Melbourne",date:"06–08 mar 2026",status:"Programada"},
  {id:2,round:2,name:"GP da China",circuit:"Shanghai International Circuit",date:"13–15 mar 2026",status:"Programada"},
  {id:3,round:3,name:"GP do Japão",circuit:"Suzuka International Racing Course",date:"27–29 mar 2026",status:"Programada"},
  {id:4,round:4,name:"GP do Bahrein",circuit:"Bahrain International Circuit — Sakhir",date:"10–12 abr 2026",status:"Programada"},
  {id:5,round:5,name:"GP da Arábia Saudita",circuit:"Jeddah Corniche Circuit",date:"17–19 abr 2026",status:"Programada"},
  {id:6,round:6,name:"GP de Miami",circuit:"Miami International Autodrome",date:"01–03 mai 2026",status:"Programada"},
  {id:7,round:7,name:"GP do Canadá",circuit:"Circuit Gilles-Villeneuve — Montreal",date:"22–24 mai 2026",status:"Programada"},
  {id:8,round:8,name:"GP de Mônaco",circuit:"Circuit de Monaco",date:"05–07 jun 2026",status:"Programada"},
  {id:9,round:9,name:"GP de Barcelona-Catalunha",circuit:"Circuit de Barcelona-Catalunya",date:"12–14 jun 2026",status:"Programada"},
  {id:10,round:10,name:"GP da Áustria",circuit:"Red Bull Ring — Spielberg",date:"26–28 jun 2026",status:"Programada"},
  {id:11,round:11,name:"GP da Grã-Bretanha",circuit:"Silverstone Circuit",date:"03–05 jul 2026",status:"Programada"},
  {id:12,round:12,name:"GP da Bélgica",circuit:"Circuit de Spa-Francorchamps",date:"17–19 jul 2026",status:"Programada"},
  {id:13,round:13,name:"GP da Hungria",circuit:"Hungaroring — Budapeste",date:"24–26 jul 2026",status:"Programada"},
  {id:14,round:14,name:"GP dos Países Baixos",circuit:"Circuit Zandvoort",date:"21–23 ago 2026",status:"Programada"},
  {id:15,round:15,name:"GP da Itália",circuit:"Autodromo Nazionale Monza",date:"04–06 set 2026",status:"Programada"},
  {id:16,round:16,name:"GP da Espanha",circuit:"Madring — Madrid",date:"11–13 set 2026",status:"Programada"},
  {id:17,round:17,name:"GP do Azerbaijão",circuit:"Baku City Circuit",date:"24–26 set 2026",status:"Programada"},
  {id:18,round:18,name:"GP de Singapura",circuit:"Marina Bay Street Circuit",date:"09–11 out 2026",status:"Programada"},
  {id:19,round:19,name:"GP dos Estados Unidos",circuit:"Circuit of The Americas — Austin",date:"23–25 out 2026",status:"Programada"},
  {id:20,round:20,name:"GP da Cidade do México",circuit:"Autódromo Hermanos Rodríguez",date:"30 out–01 nov 2026",status:"Programada"},
  {id:21,round:21,name:"GP de São Paulo",circuit:"Autódromo José Carlos Pace — Interlagos",date:"06–08 nov 2026",status:"Programada"},
  {id:22,round:22,name:"GP de Las Vegas",circuit:"Las Vegas Strip Circuit",date:"19–21 nov 2026",status:"Programada"},
  {id:23,round:23,name:"GP do Catar",circuit:"Lusail International Circuit",date:"27–29 nov 2026",status:"Programada"},
  {id:24,round:24,name:"GP de Abu Dhabi",circuit:"Yas Marina Circuit",date:"04–06 dez 2026",status:"Programada"},
];

export default function Championship({drivers,teams}:{drivers:Driver[];teams:Team[]}) {
  const [tab,setTab]=useState<"classificacao"|"calendario"|"resultados">("classificacao");
  const [races,setRaces]=useState(initialRaces);
  const [results,setResults]=useState<Result[]>([]);
  const [raceId,setRaceId]=useState("1");
  const [draftResults,setDraftResults]=useState<Record<string,{position:string;status:string}>>({});
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
  const updateDraft=(id:string,field:"position"|"status",value:string)=>{
    setDraftResults(old=>({...old,[id]:{position:old[id]?.position??"",status:old[id]?.status??"Classificado",[field]:value}}));
  };
  const addResults=()=>{
    const already=results.filter(r=>r.raceId===Number(raceId)).map(r=>r.driverId);
    const entries=drivers.filter(d=>!already.includes(d.id)).map(d=>({driver:d,draft:draftResults[d.id]})).filter(x=>x.draft&&(x.draft.position!==""||x.draft.status!=="Classificado"));
    if(entries.length===0){setNotice("Preencha a posição ou a situação de pelo menos um piloto.");return;}
    const usedPositions=new Set<number>();
    for(const item of entries){
      const pos=item.draft!.position===""?null:Number(item.draft!.position);
      if(pos!==null&&usedPositions.has(pos)){setNotice("Há posições repetidas. Cada posição de chegada deve ser única.");return;}
      if(pos!==null)usedPositions.add(pos);
    }
    const newRows:Result[]=entries.map(({driver,draft})=>{
      const pos=draft!.status==="Abandono"||draft!.status==="Desclassificado"||draft!.status==="Não largou"?null:Number(draft!.position);
      const points=draft!.status==="Classificado"&&pos&&pos<=10?POINTS[pos-1]:0;
      return {id:Date.now()+Math.floor(Math.random()*100000),raceId:Number(raceId),driverId:driver.id,position:pos,points,status:draft!.status};
    });
    setResults(old=>[...old,...newRows]);
    setRaces(old=>old.map(r=>r.id===Number(raceId)?{...r,status:"Concluída"}:r));
    setDraftResults({});
    setNotice(`${newRows.length} resultado(s) registrado(s). Classificações atualizadas.`);
  };
  const selectedRace=races.find(r=>r.id===Number(raceId));
  const raceResults=results.filter(r=>r.raceId===Number(raceId));
  const remainingDrivers=drivers.filter(d=>!raceResults.some(r=>r.driverId===d.id));
  const filledCount=remainingDrivers.filter(d=>draftResults[d.id]&&(draftResults[d.id].position!==""||draftResults[d.id].status!=="Classificado")).length;

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
    {tab==="calendario"&&<div className="panel table-panel"><div className="panel-head"><div><h2>Calendário da temporada</h2><p>Calendário original de 24 etapas anunciado para 2026. Bahrain e Arábia Saudita foram mantidos como solicitado, apesar dos cancelamentos posteriores.</p></div><button className="primary-button compact" onClick={()=>setShowRace(v=>!v)}><Plus size={15}/> Nova etapa</button></div>
      {showRace&&<div className="race-form"><label>ETAPA<input value={raceName} onChange={e=>setRaceName(e.target.value)} placeholder="Ex.: GP de São Paulo"/></label><label>CIRCUITO<input value={circuit} onChange={e=>setCircuit(e.target.value)} placeholder="Nome do circuito"/></label><label>DATA<input type="date" value={raceDate} onChange={e=>setRaceDate(e.target.value)}/></label><button className="primary-button compact" disabled={!raceName.trim()||!circuit.trim()} onClick={addRace}><Check size={15}/> Adicionar</button></div>}
      <div className="table-wrap"><table><thead><tr><th>RODADA</th><th>GRANDE PRÊMIO</th><th>CIRCUITO</th><th>DATA</th><th>STATUS</th></tr></thead><tbody>{races.slice().sort((a,b)=>a.round-b.round).map(r=><tr key={r.id}><td><b>R{String(r.round).padStart(2,"0")}</b></td><td><b>{r.name}</b></td><td>{r.circuit}</td><td>{r.date||"A definir"}</td><td><span className={r.status==="Concluída"?"status-tag":"race-pending"}>{r.status}</span></td></tr>)}</tbody></table></div>
      <div className="market-note"><Flag size={15}/><span>Baseado no calendário original divulgado pela FIA em 09/06/2025. Inclui Bahrain (10–12 abr) e Arábia Saudita (17–19 abr), posteriormente cancelados. As datas de Azerbaijão foram mantidas no fim de semana originalmente anunciado (25–27 set); confira a programação oficial antes de usar como agenda operacional.</span></div>
    </div>}
    {tab==="resultados"&&<div className="champ-results-workspace">
      <div className="panel result-entry">
        <div className="panel-head result-panel-heading"><div><h2>Lançar classificação da etapa</h2><p>Selecione o GP e preencha a chegada de vários pilotos de uma só vez.</p></div><span className="status-tag">{raceResults.length} REGISTRADOS</span></div>
        <div className="result-event-picker"><label>ETAPA DA TEMPORADA<select value={raceId} onChange={e=>{setRaceId(e.target.value);setDraftResults({});}}>{races.slice().sort((a,b)=>a.round-b.round).map(r=><option key={r.id} value={r.id}>R{String(r.round).padStart(2,"0")} · {r.name} — {r.circuit}</option>)}</select></label><div className="result-event-meta"><span>{selectedRace?.date||"Data a definir"}</span><span>{remainingDrivers.length} pilotos pendentes</span></div></div>
        <div className="result-bulk-toolbar"><div><b>Ordem de chegada</b><small>Deixe em branco quem ainda não deseja registrar.</small></div><span>{filledCount} preenchidos</span></div>
        <div className="result-driver-list">
          {remainingDrivers.map(d=>{const draft=draftResults[d.id]??{position:"",status:"Classificado"};const points=draft.status==="Classificado"&&draft.position!==""&&Number(draft.position)<=10?POINTS[Number(draft.position)-1]:0;return <div className="result-driver-row" key={d.id}>
            <div className="result-driver-identity"><span className="driver-number">{d.number}</span><div><b>{d.name}</b><small>{teamName(d.teamId)}</small></div></div>
            <label className="result-position-field"><span>POSIÇÃO</span><select value={draft.position} onChange={e=>updateDraft(d.id,"position",e.target.value)}><option value="">—</option>{Array.from({length:22},(_,i)=><option key={i+1} value={String(i+1)}>{i+1}º</option>)}</select></label>
            <label className="result-status-field"><span>SITUAÇÃO</span><select value={draft.status} onChange={e=>updateDraft(d.id,"status",e.target.value)}><option>Classificado</option><option>Abandono</option><option>Desclassificado</option><option>Não largou</option></select></label>
            <b className="result-row-points">{points} <small>PTS</small></b>
          </div>})}
          {remainingDrivers.length===0&&<div className="all-results-done"><Check size={17}/> Todos os pilotos já possuem resultado nesta etapa.</div>}
        </div>
        <div className="result-bulk-footer"><span>Os pontos são calculados automaticamente conforme a posição.</span><button className="primary-button" disabled={filledCount===0} onClick={addResults}><Check size={16}/> Salvar {filledCount||""} resultado(s)</button></div>
      </div>
      <div className="panel table-panel result-recorded-panel"><div className="panel-head"><div><h2>Resultados desta etapa</h2><p>{selectedRace?.name??"Etapa selecionada"} · lançamentos já salvos</p></div></div><div className="table-wrap"><table><thead><tr><th>POS.</th><th>PILOTO</th><th>EQUIPE</th><th>SITUAÇÃO</th><th>PTS</th></tr></thead><tbody>{raceResults.length===0?<tr><td colSpan={5} className="empty-state">Nenhum resultado registrado para esta etapa.</td></tr>:raceResults.slice().sort((a,b)=>(a.position??99)-(b.position??99)).map(r=><tr key={r.id}><td><b className="champ-position">{r.position?r.position+"º":"—"}</b></td><td><b>{driverName(r.driverId)}</b></td><td>{teamName(drivers.find(d=>d.id===r.driverId)?.teamId??"")}</td><td>{r.status}</td><td><b className="champ-points">{r.points}</b></td></tr>)}</tbody></table></div></div>
    </div>}
    <div className="champ-footnote"><Medal size={14}/> Pontuação padrão da corrida: 25–18–15–12–10–8–6–4–2–1. Sem ponto extra por volta mais rápida. Dados e resultados são locais neste protótipo e não representam resultados oficiais.</div>
  </div>;
}
