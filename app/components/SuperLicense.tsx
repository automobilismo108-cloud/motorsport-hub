"use client";

import { useMemo, useState } from "react";
import { useCloudState } from "@/lib/useCloudState";
import { drivers as f2Drivers } from "./Formula2Championship";
import { drivers as f3Drivers } from "./Formula3Championship";
import { BadgeCheck, Clock3, ShieldCheck, Trophy } from "lucide-react";

type Race = { id: number; status: "Programada" | "Concluída" };
type Result = { raceId: number; session: "Sprint" | "Feature"; driverId: string; position: number | null; points: number; status: string };
type Award = { driverName: string; category: "F2" | "F3"; season: number; points: number };
type DriverRow = { id: string; name: string; points: number; wins: number; podiums: number };

const CURRENT_SEASON = 2026;
const REQUIRED_POINTS = 40;
const F2_AWARDS = [40,35,30,25,20,15,10,8,6,4];
const F3_AWARDS = [30,25,20,15,12,9,7,5,3,2];

function buildStandings(drivers: {id:string;name:string}[], results: Result[]): DriverRow[] {
  return drivers.map(driver => {
    const rows = results.filter(result => result.driverId === driver.id);
    return {
      ...driver,
      points: rows.reduce((sum, result) => sum + result.points, 0),
      wins: rows.filter(result => result.position === 1).length,
      podiums: rows.filter(result => result.position !== null && result.position <= 3).length,
    };
  }).sort((a,b) => b.points-a.points || b.wins-a.wins || b.podiums-a.podiums || a.name.localeCompare(b.name));
}

export default function SuperLicense() {
  const [f2Races,,f2RacesReady,f2RacesError] = useCloudState<Race[]>("championship:f2:2026:races", []);
  const [f2Results,,f2ResultsReady,f2ResultsError] = useCloudState<Result[]>("championship:f2:2026:results", []);
  const [f3Races,,f3RacesReady,f3RacesError] = useCloudState<Race[]>("championship:f3:2026:races", []);
  const [f3Results,,f3ResultsReady,f3ResultsError] = useCloudState<Result[]>("championship:f3:2026:results", []);
  const [awards,setAwards,awardsReady,awardsError] = useCloudState<Award[]>("superlicense:season-awards", []);
  const [notice,setNotice] = useState("");

  const f2Standings = useMemo(() => buildStandings(f2Drivers, f2Results), [f2Results]);
  const f3Standings = useMemo(() => buildStandings(f3Drivers, f3Results), [f3Results]);
  const f2Complete = f2Races.length > 0 && f2Races.every(race => race.status === "Concluída") &&
    f2Races.every(race => ["Sprint","Feature"].every(session =>
      f2Drivers.every(driver => f2Results.some(result => result.raceId === race.id && result.session === session && result.driverId === driver.id))));
  const f3Complete = f3Races.length > 0 && f3Races.every(race => race.status === "Concluída") &&
    f3Races.every(race => ["Sprint","Feature"].every(session =>
      f3Drivers.every(driver => f3Results.some(result => result.raceId === race.id && result.session === session && result.driverId === driver.id))));

  const currentAwards = useMemo(() => {
    const already = new Set(awards.map(item => item.category + "-" + item.season));
    return {
      f2: already.has("F2-" + CURRENT_SEASON),
      f3: already.has("F3-" + CURRENT_SEASON),
    };
  }, [awards]);

  const registerSeason = (category: "F2" | "F3") => {
    const complete = category === "F2" ? f2Complete : f3Complete;
    const exists = category === "F2" ? currentAwards.f2 : currentAwards.f3;
    if (!complete) {
      setNotice("Ainda faltam resultados: registre todos os pilotos nas sessões Sprint e Feature de todas as etapas antes de fechar a temporada.");
      return;
    }
    if (exists) {
      setNotice("A pontuação desta categoria já foi registrada para 2026. Ela não será duplicada.");
      return;
    }
    const standings = category === "F2" ? f2Standings : f3Standings;
    const table = category === "F2" ? F2_AWARDS : F3_AWARDS;
    const newAwards = standings.slice(0,10).map((driver,index) => ({
      driverName: driver.name,
      category,
      season: CURRENT_SEASON,
      points: table[index] ?? 0,
    }));
    setAwards(old => [...old, ...newAwards]);
    setNotice("Pontuação da Superlicença da " + category + " 2026 registrada com sucesso.");
  };

  const totals = useMemo(() => {
    const firstSeason = CURRENT_SEASON - 2;
    const grouped = new Map<string,{name:string;points:number;seasons:number[]}>();
    awards.filter(item => item.season >= firstSeason && item.season <= CURRENT_SEASON).forEach(item => {
      const key = item.driverName.trim().toLocaleLowerCase("pt-BR");
      const current = grouped.get(key) ?? {name:item.driverName,points:0,seasons:[]};
      current.points += item.points;
      if (!current.seasons.includes(item.season)) current.seasons.push(item.season);
      grouped.set(key,current);
    });
    return [...grouped.values()].sort((a,b)=>b.points-a.points || a.name.localeCompare(b.name));
  }, [awards]);

  const loading = !f2RacesReady || !f2ResultsReady || !f3RacesReady || !f3ResultsReady || !awardsReady;
  const error = f2RacesError || f2ResultsError || f3RacesError || f3ResultsError || awardsError;
  if (error) return <div className="notice">Não foi possível carregar os dados da Superlicença. Seus resultados não foram alterados; verifique a conexão com o Supabase.</div>;
  if (loading) return <div className="panel" style={{padding:20,color:"#aeb9c7"}}>Sincronizando os dados da Superlicença...</div>;

  return <div className="championship-module">
    {notice && <div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}>×</button></div>}
    <div className="champ-hero panel">
      <div className="champ-hero-icon"><ShieldCheck size={23}/></div>
      <div className="champ-hero-copy"><span className="eyebrow">ELEGIBILIDADE PARA A FÓRMULA 1</span><h2>Superlicença FIA · MOTORSPORT HUB</h2><p>É necessário acumular pelo menos 40 pontos nas últimas três temporadas para ficar elegível à F1.</p></div>
      <div className="champ-progress"><b>40 <span>PTS</span></b><small>MÍNIMO EXIGIDO</small></div>
    </div>

    <div className="champ-standings-grid">
      <div className="panel table-panel">
        <div className="panel-head"><div><h2>Pontos por posição · F2</h2><p>Créditos concedidos ao fechar a classificação final da temporada</p></div><span className="status-tag">FÓRMULA 2</span></div>
        <div className="table-wrap"><table><thead><tr><th>POSIÇÃO FINAL</th><th>PONTOS DE SUPERLICENÇA</th></tr></thead><tbody>{F2_AWARDS.map((points,index)=><tr key={index}><td><b>{index+1}º</b></td><td><b className="champ-points">{points}</b></td></tr>)}</tbody></table></div>
        <div style={{padding:16}}><button className="primary-button compact" disabled={currentAwards.f2} onClick={()=>registerSeason("F2")}><Trophy size={15}/>{currentAwards.f2 ? "Pontuação 2026 registrada" : "Registrar classificação final da F2 2026"}</button><p style={{color:"#aeb9c7",fontSize:12,marginTop:10}}>{f2Complete ? "Todas as etapas e sessões estão completas." : "Aguardando resultados completos de todas as etapas, incluindo Sprint e Feature."}</p></div>
      </div>
      <div className="panel table-panel">
        <div className="panel-head"><div><h2>Pontos por posição · F3</h2><p>Créditos concedidos ao fechar a classificação final da temporada</p></div><span className="status-tag">FÓRMULA 3</span></div>
        <div className="table-wrap"><table><thead><tr><th>POSIÇÃO FINAL</th><th>PONTOS DE SUPERLICENÇA</th></tr></thead><tbody>{F3_AWARDS.map((points,index)=><tr key={index}><td><b>{index+1}º</b></td><td><b className="champ-points">{points}</b></td></tr>)}</tbody></table></div>
        <div style={{padding:16}}><button className="primary-button compact" disabled={currentAwards.f3} onClick={()=>registerSeason("F3")}><Trophy size={15}/>{currentAwards.f3 ? "Pontuação 2026 registrada" : "Registrar classificação final da F3 2026"}</button><p style={{color:"#aeb9c7",fontSize:12,marginTop:10}}>{f3Complete ? "Todas as etapas e sessões estão completas." : "Aguardando resultados completos de todas as etapas, incluindo Sprint e Feature."}</p></div>
      </div>
    </div>

    <div className="panel table-panel" style={{marginTop:18}}>
      <div className="panel-head"><div><h2>Controle de Superlicença</h2><p>Pontuação acumulada nas três temporadas mais recentes registradas</p></div><span className="status-tag"><Clock3 size={13}/> JANELA MÓVEL · 3 ANOS</span></div>
      <div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>PONTOS</th><th>TEMPORADAS</th><th>STATUS PARA F1</th></tr></thead><tbody>
        {totals.length===0 ? <tr><td colSpan={4} className="empty-state">Nenhuma pontuação registrada. Os pontos serão lançados após o fechamento de uma temporada completa.</td></tr> : totals.map(driver=><tr key={driver.name}><td><b>{driver.name}</b></td><td><b className="champ-points">{driver.points}</b> / {REQUIRED_POINTS}</td><td>{driver.seasons.sort((a,b)=>b-a).join(", ")}</td><td>{driver.points>=REQUIRED_POINTS ? <span className="status-tag"><BadgeCheck size={13}/> Elegível à F1</span> : <span className="race-pending">{REQUIRED_POINTS-driver.points} pontos restantes</span>}</td></tr>)}
      </tbody></table></div>
      <div className="market-note"><ShieldCheck size={15}/><span>Os pontos da F2 e da F3 são somados por piloto. Apenas os pontos das três temporadas mais recentes entram no cálculo. A Superlicença é uma exigência adicional: a equipe não poderá contratar para a F1 um piloto que não atingir 40 pontos.</span></div>
    </div>
  </div>;
}
