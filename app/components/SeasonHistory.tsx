"use client";

import { useCloudState } from "@/lib/useCloudState";
import type { SeasonArchive } from "@/lib/seasonHistory";
import { Trophy, Medal, Flag, CalendarDays } from "lucide-react";

const categories = [
  {id:"f1",label:"Fórmula 1",key:"championship:f1:history"},
  {id:"f2",label:"Fórmula 2",key:"championship:f2:history"},
  {id:"f3",label:"Fórmula 3",key:"championship:f3:history"}
] as const;

export default function SeasonHistory() {
  const [f1,,f1Ready,f1Error] = useCloudState<SeasonArchive[]>("championship:f1:history",[]);
  const [f2,,f2Ready,f2Error] = useCloudState<SeasonArchive[]>("championship:f2:history",[]);
  const [f3,,f3Ready,f3Error] = useCloudState<SeasonArchive[]>("championship:f3:history",[]);
  if(f1Error||f2Error||f3Error) return <div className="notice">Não foi possível carregar o histórico. Os registros não foram alterados.</div>;
  if(!f1Ready||!f2Ready||!f3Ready) return <div className="panel" style={{padding:20,color:"#aeb9c7"}}>Carregando histórico de temporadas...</div>;
  const archives=[...f1,...f2,...f3].sort((a,b)=>b.season-a.season||a.category.localeCompare(b.category));
  const label=(category:string)=>categories.find(item=>item.id===category.toLowerCase())?.label??category;
  return <div className="championship-module">
    <div className="champ-hero panel"><div className="champ-hero-icon"><Trophy size={23}/></div><div className="champ-hero-copy"><span className="eyebrow">REGISTRO PERMANENTE</span><h2>Histórico de temporadas</h2><p>Classificações finais preservadas após a finalização de cada campeonato.</p></div><div className="champ-progress"><b>{String(archives.length).padStart(2,"0")}</b><small>TEMPORADAS ARQUIVADAS</small></div></div>
    {archives.length===0 ? <div className="panel table-panel" style={{padding:24}}><div className="empty-state"><CalendarDays size={22}/><p>Nenhuma temporada finalizada foi arquivada ainda.</p><small>Quando você finalizar uma temporada da F1, F2 ou F3, a classificação aparecerá aqui.</small></div></div> :
      archives.map(archive=><div className="panel table-panel" key={archive.category+"-"+archive.season} style={{marginBottom:16}}>
        <div className="panel-head"><div><span className="eyebrow">{label(archive.category)}</span><h2>Temporada {archive.season}</h2><p>Finalizada em {new Date(archive.finalizedAt).toLocaleDateString("pt-BR")} · {archive.races.length} etapas · {archive.results.length} resultados</p></div><span className="status-tag">ARQUIVADA</span></div>
        <div className="champ-standings-grid">
          <div><h3><Medal size={15}/> Classificação de pilotos</h3><div className="table-wrap"><table><thead><tr><th>POS.</th><th>PILOTO</th><th>EQUIPE</th><th>VIT.</th><th>PÓD.</th><th>PTS</th></tr></thead><tbody>{archive.drivers.map(driver=><tr key={driver.id}><td><b className="champ-position">{String(driver.position).padStart(2,"0")}</b></td><td><b>{driver.name}</b></td><td>{driver.team}</td><td>{driver.wins}</td><td>{driver.podiums}</td><td><b className="champ-points">{driver.points}</b></td></tr>)}</tbody></table></div></div>
          <div><h3><Flag size={15}/> Classificação de equipes</h3><div className="constructor-list">{archive.teams.map(team=><div className="constructor-row" key={team.id}><b className="champ-position">{String(team.position).padStart(2,"0")}</b><span>{team.name}</span><strong>{team.points} <small>PTS</small></strong></div>)}</div></div>
        </div>
      </div>)
    }
  </div>;
}
