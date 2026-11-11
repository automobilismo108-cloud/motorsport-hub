"use client";

import { useMemo, useState } from "react";
import { useCloudState } from "@/lib/useCloudState";
import { CalendarDays, ClipboardList, Flag, Medal, Trophy, Check, X } from "lucide-react";

type Driver = { id: string; name: string; country: string; number: number; teamId: string };
type Team = { id: string; name: string; short: string; color: string; headquarters: string };
type Race = { id: number; round: number; name: string; circuit: string; date: string; status: "Programada" | "Concluída" };
type Result = { id: number; raceId: number; session: "Sprint" | "Feature"; driverId: string; position: number | null; points: number; status: string };
type SuperLicenseAward = { id: string; driverId: string; driverName: string; category: "F2" | "F3"; season: number; position: number; points: number };

const teams: Team[] = [
  {id:"cam",name:"Campos Racing",short:"CAM",color:"#e23d3d",headquarters:"Alzira, Valência, Espanha"},
  {id:"tri",name:"TRIDENT",short:"TRI",color:"#238b5b",headquarters:"Ossona, região de Milão, Itália"},
  {id:"mp",name:"MP Motorsport",short:"MP",color:"#f3a52d",headquarters:"Westmaas, Países Baixos"},
  {id:"art",name:"ART Grand Prix",short:"ART",color:"#6a9bd6",headquarters:"Saint-Pierre-du-Perray, França"},
  {id:"var",name:"Van Amersfoort Racing",short:"VAR",color:"#e8e8e8",headquarters:"Zeewolde, Países Baixos"},
  {id:"rod",name:"Rodin Motorsport",short:"ROD",color:"#43a6a0",headquarters:"Farnham, Surrey, Reino Unido"},
  {id:"pre",name:"PREMA Racing",short:"PRE",color:"#f5f5f5",headquarters:"Grisignano di Zocco, Vicenza, Itália"},
  {id:"hit",name:"Hitech",short:"HIT",color:"#2477c8",headquarters:"Silverstone, Reino Unido"},
  {id:"aix",name:"AIX Racing",short:"AIX",color:"#d9a7e8",headquarters:"Andernach, Alemanha"},
  {id:"dam",name:"DAMS Lucas Oil",short:"DAMS",color:"#d7dce3",headquarters:"Ruaudin, França"},
];

const drivers: Driver[] = [
  {id:"f3-1",name:"Théophile Naël",country:"França",number:1,teamId:"cam"},
  {id:"f3-2",name:"Ugo Ugochukwu",country:"Estados Unidos",number:2,teamId:"cam"},
  {id:"f3-3",name:"Ernesto Rivera",country:"México",number:3,teamId:"cam"},
  {id:"f3-4",name:"Noah Stromsted",country:"Dinamarca",number:4,teamId:"tri"},
  {id:"f3-5",name:"Freddie Slater",country:"Reino Unido",number:5,teamId:"tri"},
  {id:"f3-6",name:"Matteo De Palo",country:"Itália",number:6,teamId:"tri"},
  {id:"f3-7",name:"Mattia Colnaghi",country:"Argentina",number:7,teamId:"mp"},
  {id:"f3-8",name:"Tuukka Taponen",country:"Finlândia",number:8,teamId:"mp"},
  {id:"f3-9",name:"Alessandro Giusti",country:"França",number:9,teamId:"mp"},
  {id:"f3-10",name:"Taito Kato",country:"Japão",number:10,teamId:"art"},
  {id:"f3-11",name:"Maciej Gladysz",country:"Polônia",number:11,teamId:"art"},
  {id:"f3-12",name:"Kanato Le",country:"Japão",number:12,teamId:"art"},
  {id:"f3-14",name:"Hiyu Yamakoshi",country:"Japão",number:14,teamId:"var"},
  {id:"f3-15",name:"Enzo Deligny",country:"França",number:15,teamId:"var"},
  {id:"f3-16",name:"Bruno Del Pino",country:"Espanha",number:16,teamId:"var"},
  {id:"f3-17",name:"Pedro Clerot",country:"Brasil",number:17,teamId:"rod"},
  {id:"f3-18",name:"Brando Badoer",country:"Itália",number:18,teamId:"rod"},
  {id:"f3-19",name:"Niccolò Maccagnani",country:"Itália",number:19,teamId:"rod"},
  {id:"f3-20",name:"Alex Powell",country:"Estados Unidos",number:20,teamId:"pre"},
  {id:"f3-21",name:"James Wharton",country:"Austrália",number:21,teamId:"pre"},
  {id:"f3-22",name:"Jose Garfias",country:"México",number:22,teamId:"pre"},
  {id:"f3-23",name:"Woohyun Shin",country:"Coreia do Sul",number:23,teamId:"hit"},
  {id:"f3-24",name:"Fionn McLaughlin",country:"Irlanda",number:24,teamId:"hit"},
  {id:"f3-25",name:"Jin Nakamura",country:"Japão",number:25,teamId:"hit"},
  {id:"f3-26",name:"Ricardo Escotto",country:"México",number:26,teamId:"aix"},
  {id:"f3-27",name:"Yevan David",country:"Sri Lanka",number:27,teamId:"aix"},
  {id:"f3-28",name:"Fernando Barrichello",country:"Brasil",number:28,teamId:"aix"},
  {id:"f3-29",name:"Nicola Lacorte",country:"Itália",number:29,teamId:"dam"},
  {id:"f3-30",name:"Nandhavud Bhirombhakdi",country:"Tailândia",number:30,teamId:"dam"},
  {id:"f3-31",name:"Gerrard Xie",country:"China",number:31,teamId:"dam"}
];

const initialRaces: Race[] = [
  {id:1,round:1,name:"GP da Austrália",circuit:"Albert Park — Melbourne",date:"06–08 mar 2026",status:"Programada"},
  {id:2,round:2,name:"GP do Bahrein",circuit:"Bahrain International Circuit — Sakhir",date:"10–12 abr 2026",status:"Programada"},
  {id:3,round:3,name:"GP de Mônaco",circuit:"Circuit de Monaco",date:"04–07 jun 2026",status:"Programada"},
  {id:4,round:4,name:"GP da Espanha",circuit:"Circuit de Barcelona-Catalunya",date:"12–14 jun 2026",status:"Programada"},
  {id:5,round:5,name:"GP da Áustria",circuit:"Red Bull Ring — Spielberg",date:"26–28 jun 2026",status:"Programada"},
  {id:6,round:6,name:"GP da Grã-Bretanha",circuit:"Silverstone Circuit",date:"03–05 jul 2026",status:"Programada"},
  {id:7,round:7,name:"GP da Bélgica",circuit:"Circuit de Spa-Francorchamps",date:"17–19 jul 2026",status:"Programada"},
  {id:8,round:8,name:"GP da Hungria",circuit:"Hungaroring — Budapeste",date:"24–26 jul 2026",status:"Programada"},
  {id:9,round:9,name:"GP da Itália",circuit:"Autodromo Nazionale Monza",date:"04–06 set 2026",status:"Programada"},
  {id:10,round:10,name:"GP de Madrid",circuit:"Madring — Madrid",date:"11–13 set 2026",status:"Programada"}
];

const teamDetails: Record<string, { power: number; downforce: number }> = {
  cam:{power:70,downforce:70},tri:{power:70,downforce:70},mp:{power:70,downforce:70},
  art:{power:70,downforce:70},var:{power:70,downforce:70},rod:{power:70,downforce:70},
  pre:{power:70,downforce:70},hit:{power:70,downforce:70},aix:{power:70,downforce:70},
  dam:{power:70,downforce:70},
};

const driverDetails: Record<string, { age: number; attributes: { racePace: number; qualifying: number; overtaking: number; defending: number; consistency: number } }> = {
  "Théophile Naël": { age:17, attributes:{racePace:64,qualifying:63,overtaking:65,defending:62,consistency:61} },
  "Ugo Ugochukwu": { age:18, attributes:{racePace:62,qualifying:61,overtaking:63,defending:60,consistency:59} },
  "Ernesto Rivera": { age:19, attributes:{racePace:60,qualifying:59,overtaking:62,defending:58,consistency:57} },
  "Noah Stromsted": { age:20, attributes:{racePace:58,qualifying:57,overtaking:60,defending:56,consistency:55} },
  "Freddie Slater": { age:21, attributes:{racePace:56,qualifying:55,overtaking:58,defending:54,consistency:53} },
  "Matteo De Palo": { age:17, attributes:{racePace:64,qualifying:62,overtaking:64,defending:61,consistency:60} },
  "Mattia Colnaghi": { age:18, attributes:{racePace:62,qualifying:60,overtaking:62,defending:59,consistency:58} },
  "Tuukka Taponen": { age:19, attributes:{racePace:60,qualifying:58,overtaking:61,defending:57,consistency:56} },
  "Alessandro Giusti": { age:20, attributes:{racePace:59,qualifying:58,overtaking:60,defending:56,consistency:55} },
  "Taito Kato": { age:21, attributes:{racePace:56,qualifying:55,overtaking:58,defending:54,consistency:53} },
  "Maciej Gladysz": { age:17, attributes:{racePace:63,qualifying:64,overtaking:62,defending:61,consistency:60} },
  "Kanato Le": { age:18, attributes:{racePace:61,qualifying:62,overtaking:60,defending:59,consistency:58} },
  "Hiyu Yamakoshi": { age:19, attributes:{racePace:60,qualifying:59,overtaking:61,defending:57,consistency:56} },
  "Enzo Deligny": { age:20, attributes:{racePace:58,qualifying:57,overtaking:59,defending:56,consistency:55} },
  "Bruno Del Pino": { age:21, attributes:{racePace:55,qualifying:54,overtaking:57,defending:53,consistency:52} },
  "Pedro Clerot": { age:17, attributes:{racePace:64,qualifying:62,overtaking:64,defending:60,consistency:61} },
  "Brando Badoer": { age:18, attributes:{racePace:62,qualifying:60,overtaking:62,defending:58,consistency:59} },
  "Niccolò Maccagnani": { age:19, attributes:{racePace:60,qualifying:58,overtaking:60,defending:57,consistency:56} },
  "Alex Powell": { age:20, attributes:{racePace:58,qualifying:57,overtaking:59,defending:55,consistency:54} },
  "James Wharton": { age:21, attributes:{racePace:56,qualifying:55,overtaking:57,defending:53,consistency:52} },
  "Jose Garfias": { age:17, attributes:{racePace:62,qualifying:61,overtaking:63,defending:60,consistency:59} },
  "Woohyun Shin": { age:18, attributes:{racePace:60,qualifying:59,overtaking:61,defending:57,consistency:56} },
  "Fionn McLaughlin": { age:19, attributes:{racePace:59,qualifying:58,overtaking:60,defending:56,consistency:55} },
  "Jin Nakamura": { age:20, attributes:{racePace:57,qualifying:56,overtaking:58,defending:54,consistency:53} },
  "Ricardo Escotto": { age:21, attributes:{racePace:55,qualifying:54,overtaking:56,defending:52,consistency:51} },
  "Yevan David": { age:17, attributes:{racePace:63,qualifying:61,overtaking:64,defending:60,consistency:59} },
  "Fernando Barrichello": { age:18, attributes:{racePace:61,qualifying:59,overtaking:62,defending:58,consistency:57} },
  "Nicola Lacorte": { age:19, attributes:{racePace:60,qualifying:58,overtaking:61,defending:56,consistency:55} },
  "Nandhavud Bhirombhakdi": { age:20, attributes:{racePace:57,qualifying:55,overtaking:58,defending:54,consistency:53} },
  "Gerrard Xie": { age:21, attributes:{racePace:55,qualifying:53,overtaking:56,defending:52,consistency:51} }
};

const sprintPoints = [10,8,6,5,4,3,2,1];
const featurePoints = [25,18,15,12,10,8,6,4,2,1];

export default function Formula2Championship() {
  const [tab,setTab] = useState<"classificacao"|"calendario"|"resultados">("classificacao");
  const [races,setRaces,racesReady,racesError] = useCloudState<Race[]>("championship:f3:2026:races",initialRaces);
  const [results,setResults,resultsReady,resultsError] = useCloudState<Result[]>("championship:f3:2026:results",[]);
  const [licenseAwards,setLicenseAwards,licenseReady,licenseError] = useCloudState<SuperLicenseAward[]>("superlicense:awards",[]);
  const [raceId,setRaceId] = useState("1");
  const [session,setSession] = useState<"Sprint"|"Feature">("Sprint");
  const [draft,setDraft] = useState<Record<string,{position:string;status:string}>>({});
  const [notice,setNotice] = useState("");
  const [profileDriverId,setProfileDriverId] = useState<string | null>(null);
  const [profileTeamId,setProfileTeamId] = useState<string | null>(null);

  const teamName=(id:string)=>teams.find(t=>t.id===id)?.name??"Equipe não encontrada";
  const profileDriver=drivers.find(d=>d.id===profileDriverId);
  const profileTeam=teams.find(t=>t.id===profileTeamId);
  const profileTeamDetails=profileTeam ? teamDetails[profileTeam.id] : undefined;
  const profileDetails=profileDriver ? driverDetails[profileDriver.name] : undefined;
  const teamColor=(id:string)=>teams.find(t=>t.id===id)?.color??"#8491a2";
  const standings=useMemo(()=>drivers.map(d=>{
    const rows=results.filter(r=>r.driverId===d.id);
    return {...d,points:rows.reduce((sum,r)=>sum+r.points,0),wins:rows.filter(r=>r.position===1).length,podiums:rows.filter(r=>r.position!==null&&r.position<=3).length,starts:rows.length};
  }).sort((a,b)=>b.points-a.points||b.wins-a.wins||b.podiums-a.podiums),[results]);
  const teamStandings=useMemo(()=>teams.map(t=>({...t,points:standings.filter(d=>d.teamId===t.id).reduce((sum,d)=>sum+d.points,0)})).sort((a,b)=>b.points-a.points),[standings]);
  const selectedRace=races.find(r=>r.id===Number(raceId));
  const sessionResults=results.filter(r=>r.raceId===Number(raceId)&&r.session===session);
  const remaining=drivers.filter(d=>!sessionResults.some(r=>r.driverId===d.id));
  const filled=remaining.filter(d=>draft[d.id]&&(draft[d.id].position!==""||draft[d.id].status!=="Classificado")).length;
  const completed=races.filter(r=>results.some(x=>x.raceId===r.id)).length;
  const seasonAlreadyFinalized=licenseAwards.some(a=>a.category==="F3"&&a.season===2026);
  const seasonComplete=races.length>0&&races.every(r=>(["Sprint","Feature"] as const).every(kind=>drivers.every(d=>results.some(x=>x.raceId===r.id&&x.session===kind&&x.driverId===d.id))));
  const finalizeSeason=()=>{
    if(!licenseReady){setNotice("Aguarde a sincronização da Superlicença.");return;}
    if(seasonAlreadyFinalized){setNotice("Esta temporada já foi finalizada; os pontos não serão duplicados.");return;}
    if(!seasonComplete){setNotice("Registre todos os pilotos em Sprint e Feature de todas as etapas antes de finalizar.");return;}
    const finalTable=drivers.map(d=>({...d,total:results.filter(x=>x.driverId===d.id).reduce((sum,x)=>sum+x.points,0)})).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
    const pointsByPosition=[30,25,20,15,12,9,7,5,3,2];
    const awards:SuperLicenseAward[]=finalTable.slice(0,10).map((d,index)=>({id:"F3-2026-"+d.id,driverId:d.id,driverName:d.name,category:"F3",season:2026,position:index+1,points:pointsByPosition[index]}));
    setLicenseAwards(old=>[...old.filter(a=>!(a.category==="F3"&&a.season===2026)),...awards]);
    setNotice("Classificação final da Fórmula 3 2026 confirmada. Pontos registrados uma única vez.");
  };
  const profileLicensePoints=licenseAwards.filter(a=>a.driverName.trim().toLocaleLowerCase("pt-BR")===profileDriver?.name.trim().toLocaleLowerCase("pt-BR")&&a.season>=2024&&a.season<=2026).reduce((sum,a)=>sum+a.points,0);
  const profileLicenseEligible=profileLicensePoints>=40;

  const saveResults=()=>{
    const used=new Set<number>();
    const entries=remaining.filter(d=>draft[d.id]&&(draft[d.id].position!==""||draft[d.id].status!=="Classificado"));
    if(!entries.length){setNotice("Preencha a posição ou a situação de pelo menos um piloto.");return;}
    for(const d of entries){const p=draft[d.id].position===""?null:Number(draft[d.id].position);if(p!==null&&used.has(p)){setNotice("Há posições repetidas. Cada posição deve ser única.");return;}if(p!==null)used.add(p);}
    const rows:Result[]=entries.map(d=>{
      const item=draft[d.id];const pos=["Abandono","Desclassificado","Não largou"].includes(item.status)?null:Number(item.position);
      const scale=session==="Sprint"?sprintPoints:featurePoints;
      const points=item.status==="Classificado"&&pos&&pos<=scale.length?scale[pos-1]:0;
      return {id:Date.now()+Math.floor(Math.random()*100000),raceId:Number(raceId),session,driverId:d.id,position:pos,points,status:item.status};
    });
    setResults(old=>[...old,...rows]);
    if(!results.some(r=>r.raceId===Number(raceId))){setRaces(old=>old.map(r=>r.id===Number(raceId)?{...r,status:"Concluída"}:r));}
    setDraft({});
    setNotice(rows.length+" resultado(s) de "+session+" registrados. Classificações atualizadas.");
  };

  if(racesError||resultsError||licenseError)return <div className="notice">Não foi possível sincronizar os dados da Fórmula 3.</div>;
  if(!racesReady||!resultsReady||!licenseReady)return <div className="panel" style={{padding:20,color:"#aeb9c7"}}>Sincronizando os dados da Fórmula 3...</div>;

  return <div className="championship-module">
    {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    {profileTeam ? <div className="driver-profile-page">
      <button className="champ-back-button" onClick={()=>setProfileTeamId(null)}><Flag size={15}/> Voltar ao campeonato</button>
      <div className="panel driver-profile-hero">
        <div className="driver-profile-number" style={{color:profileTeam.color}}>F3</div>
        <div className="driver-profile-heading"><span className="eyebrow">FICHA DA EQUIPE · FÓRMULA 3</span><h2>{profileTeam.name}</h2><p>{profileTeam.headquarters} · Temporada 2026</p></div>
        <span className="status-tag">EQUIPE F3</span>
      </div>
      <div className="driver-facts-grid">
        <div className="panel driver-fact"><span>SEDE</span><b>{profileTeam.headquarters}</b></div>
        <div className="panel driver-fact"><span>PILOTOS</span><b>{drivers.filter(d=>d.teamId===profileTeam.id).length} inscritos</b></div>
        <div className="panel driver-fact"><span>CAMPEONATO</span><b>FIA Formula 3 · 2026</b></div>
      </div>
      <div className="panel driver-attributes-panel">
        <div className="panel-head"><div><h2>Atributos da equipe</h2><p>Avaliação de desempenho · escala de 0 a 100</p></div><span className="status-tag">AVALIAÇÃO 0–100</span></div>
        <div className="driver-attributes-list">
          {([{key:"power",label:"Power"},{key:"downforce",label:"Downforce"}] as const).map(attribute => <div className="driver-attribute-row" key={attribute.key}><div><b>{attribute.label}</b><strong>{profileTeamDetails?.[attribute.key] ?? 0}</strong></div><div className="driver-attribute-track"><i style={{width:`${profileTeamDetails?.[attribute.key] ?? 0}%`}}/></div></div>)}
        </div>
      </div>
      <div className="panel table-panel"><div className="panel-head"><div><h2>Pilotos da equipe</h2><p>Dupla inscrita na temporada 2026</p></div></div><div className="constructor-list">{drivers.filter(d=>d.teamId===profileTeam.id).map(d=><div className="constructor-row" key={d.id}><b className="champ-position">#{d.number}</b><span>{d.name}</span><button className="driver-name-link" onClick={()=>{setProfileTeamId(null);setProfileDriverId(d.id);}}>Ver ficha do piloto</button></div>)}</div></div>
    </div> : profileDriver ? <div className="driver-profile-page">
      <button className="champ-back-button" onClick={()=>setProfileDriverId(null)}><Flag size={15}/> Voltar ao campeonato</button>
      <div className="panel driver-profile-hero">
        <div className="driver-profile-number">#{profileDriver.number}</div>
        <div className="driver-profile-heading"><span className="eyebrow">FICHA DO PILOTO · FÓRMULA 3</span><h2>{profileDriver.name}</h2><p>{profileDriver.country} · <button type="button" className="driver-name-link" onClick={()=>{setProfileDriverId(null);setProfileTeamId(profileDriver.teamId);}}>{teamName(profileDriver.teamId)}</button> · Temporada 2026</p></div>
        <span className="status-tag">EM DESENVOLVIMENTO</span>
      </div>
      <div className="driver-facts-grid">
        <div className="panel driver-fact"><span>IDADE</span><b>{profileDetails?.age ?? "—"} anos</b></div>
        <div className="panel driver-fact"><span>NACIONALIDADE</span><b>{profileDriver.country}</b></div>
        <div className="panel driver-fact"><span>EQUIPE ATUAL</span><b><button type="button" className="driver-name-link" onClick={()=>{setProfileDriverId(null);setProfileTeamId(profileDriver.teamId);}}>{teamName(profileDriver.teamId)}</button></b></div>
      </div>
      <div className="panel driver-attributes-panel">
        <div className="panel-head"><div><h2>Superlicença FIA</h2><p>Pontos acumulados nas últimas três temporadas (2024–2026)</p></div><span className="status-tag">{profileLicenseEligible?"LICENCIADO":"EM FORMAÇÃO"}</span></div>
        <div className="driver-facts-grid">
          <div className="panel driver-fact"><span>PONTOS</span><b>{profileLicensePoints} / 40</b></div>
          <div className="panel driver-fact"><span>STATUS</span><b>{profileLicenseEligible?"Requisito atingido":"Ainda não elegível"}</b></div>
          <div className="panel driver-fact"><span>VALIDADE</span><b>Janela móvel de 3 temporadas</b></div>
        </div>
      </div>
      <div className="panel driver-attributes-panel">
        <div className="panel-head"><div><h2>Atributos do piloto</h2><p>Avaliação de desenvolvimento · escala de 0 a 100</p></div><span className="status-tag">AVALIAÇÃO 0–100</span></div>
        <div className="driver-attributes-list">
          {([{key:"racePace",label:"Race Pace"},{key:"qualifying",label:"Qualifying"},{key:"overtaking",label:"Overtaking"},{key:"defending",label:"Defending"},{key:"consistency",label:"Consistency"}] as const).map(attribute => <div className="driver-attribute-row" key={attribute.key}><div><b>{attribute.label}</b><strong>{profileDetails?.attributes[attribute.key] ?? 0}</strong></div><div className="driver-attribute-track"><i style={{width:`${profileDetails?.attributes[attribute.key] ?? 0}%`}}/></div></div>)}
        </div>
      </div>
    </div> : <>
    <div className="champ-hero panel"><div className="champ-hero-icon"><Trophy size={23}/></div><div className="champ-hero-copy"><span className="eyebrow">CAMPEONATO ATIVO</span><h2>FIA Formula 3 Championship</h2><p>Temporada 2026 · Fórmula 3 · Corrida Sprint e Feature</p></div><div className="champ-progress"><b>{String(completed).padStart(2,"0")} <span>/ {String(races.length).padStart(2,"0")}</span></b><small>ETAPAS COM RESULTADO</small></div></div>
    <div className="champ-tabs">
      <button className={tab==="classificacao"?"selected":""} onClick={()=>setTab("classificacao")}><Trophy size={15}/> Classificação</button>
      <button className={tab==="calendario"?"selected":""} onClick={()=>setTab("calendario")}><CalendarDays size={15}/> Calendário</button>
      <button className={tab==="resultados"?"selected":""} onClick={()=>setTab("resultados")}><ClipboardList size={15}/> Resultados</button>
    </div>
    {tab==="classificacao"&&<div className="panel table-panel" style={{marginBottom:16,padding:20}}>
      <div className="panel-head"><div><h2>Superlicença FIA · Temporada 2026</h2><p>Fórmula 3: pontos para os 10 primeiros após a confirmação da classificação final.</p></div><span className="status-tag">{seasonAlreadyFinalized?"FINALIZADA":seasonComplete?"PRONTA PARA FINALIZAR":"EM ANDAMENTO"}</span></div>
      <div className="result-bulk-footer"><span>{seasonAlreadyFinalized?"Pontos já registrados.":seasonComplete?"Todos os resultados foram preenchidos. Confirme para creditar os pontos.":"Complete Sprint e Feature de todas as etapas para habilitar a confirmação."}</span><button className="primary-button" disabled={!seasonComplete||seasonAlreadyFinalized||!licenseReady||!!licenseError} onClick={finalizeSeason}><Check size={16}/> Confirmar classificação final</button></div>
      {licenseError&&<p className="empty-state">Não foi possível sincronizar a Superlicença.</p>}
    </div>}
    {tab==="classificacao"&&<div className="champ-standings-grid">
      <div className="panel table-panel"><div className="panel-head"><div><h2>Campeonato de pilotos</h2><p>Pontuação acumulada nas corridas Sprint e Feature</p></div><span className="status-tag">30 PILOTOS</span></div><div className="table-wrap"><table><thead><tr><th>POS.</th><th>PILOTO</th><th>EQUIPE</th><th>VITÓRIAS</th><th>PÓDIOS</th><th>PTS</th></tr></thead><tbody>{standings.map((d,i)=><tr key={d.id}><td><b className="champ-position">{String(i+1).padStart(2,"0")}</b></td><td><button type="button" className="driver-name-link" onClick={()=>setProfileDriverId(d.id)}>{d.name}</button></td><td><span className="team-cell"><i style={{background:teamColor(d.teamId)}}/><button type="button" className="driver-name-link" onClick={()=>setProfileTeamId(d.teamId)}>{teamName(d.teamId)}</button></span></td><td>{d.wins}</td><td>{d.podiums}</td><td><b className="champ-points">{d.points}</b></td></tr>)}</tbody></table></div></div>
      <div className="panel table-panel"><div className="panel-head"><div><h2>Campeonato de equipes</h2><p>Soma dos pontos dos dois pilotos</p></div><span className="status-tag">10 EQUIPES</span></div><div className="constructor-list">{teamStandings.map((t,i)=><div className="constructor-row" key={t.id}><b className="champ-position">{String(i+1).padStart(2,"0")}</b><i style={{background:t.color}}/><button type="button" className="driver-name-link" onClick={()=>setProfileTeamId(t.id)}>{t.name}</button><strong>{t.points} <small>PTS</small></strong></div>)}</div></div>
    </div>}
    {tab==="calendario"&&<div className="panel table-panel"><div className="panel-head"><div><h2>Calendário da temporada</h2><p>10 etapas · 20 corridas · Sprint e Feature</p></div></div><div className="table-wrap"><table><thead><tr><th>RODADA</th><th>ETAPA</th><th>CIRCUITO</th><th>DATA</th><th>STATUS</th></tr></thead><tbody>{races.slice().sort((a,b)=>a.round-b.round).map(r=><tr key={r.id}><td><b>R{String(r.round).padStart(2,"0")}</b></td><td><b>{r.name}</b></td><td>{r.circuit}</td><td>{r.date}</td><td><span className={r.status==="Concluída"?"status-tag":"race-pending"}>{r.status}</span></td></tr>)}</tbody></table></div></div>}
    {tab==="resultados"&&<div className="champ-results-workspace">
      <div className="panel result-entry">
        <div className="panel-head result-panel-heading"><div><h2>Lançar resultado da corrida</h2><p>Selecione a etapa e o tipo de corrida para registrar a classificação.</p></div><span className="status-tag">{sessionResults.length} REGISTRADOS</span></div>
        <div className="result-event-picker"><label>ETAPA DA TEMPORADA<select value={raceId} onChange={e=>{setRaceId(e.target.value);setDraft({});}}>{races.slice().sort((a,b)=>a.round-b.round).map(r=><option key={r.id} value={r.id}>R{String(r.round).padStart(2,"0")} · {r.name} — {r.circuit}</option>)}</select></label><label style={{maxWidth:190}}>TIPO DE CORRIDA<select value={session} onChange={e=>{setSession(e.target.value as "Sprint"|"Feature");setDraft({});}}><option value="Sprint">Sprint Race</option><option value="Feature">Feature Race</option></select></label><div className="result-event-meta"><span>{selectedRace?.date}</span><span>{remaining.length} pendentes</span></div></div>
        <div className="result-bulk-toolbar"><div><b>Ordem de chegada · {session==="Sprint"?"Sprint Race":"Feature Race"}</b><small>Deixe em branco quem ainda não deseja registrar.</small></div><span>{filled} preenchidos</span></div>
        <div className="result-driver-list">{remaining.map(d=>{const item=draft[d.id]??{position:"",status:"Classificado"};const scale=session==="Sprint"?sprintPoints:featurePoints;const pts=item.status==="Classificado"&&item.position!==""&&Number(item.position)<=scale.length?scale[Number(item.position)-1]:0;return <div className="result-driver-row" key={d.id}><div className="result-driver-identity"><span className="driver-number">{d.number}</span><div><button type="button" className="driver-name-link" onClick={()=>setProfileDriverId(d.id)}>{d.name}</button><small><button type="button" className="driver-name-link" onClick={()=>setProfileTeamId(d.teamId)}>{teamName(d.teamId)}</button></small></div></div><label className="result-position-field"><span>POSIÇÃO</span><select value={item.position} onChange={e=>setDraft(old=>({...old,[d.id]:{...item,position:e.target.value}}))}><option value="">—</option>{Array.from({length:30},(_,i)=><option key={i+1} value={String(i+1)}>{i+1}º</option>)}</select></label><label className="result-status-field"><span>SITUAÇÃO</span><select value={item.status} onChange={e=>setDraft(old=>({...old,[d.id]:{...item,status:e.target.value}}))}><option>Classificado</option><option>Abandono</option><option>Desclassificado</option><option>Não largou</option></select></label><b className="result-row-points">{pts} <small>PTS</small></b></div>})}{remaining.length===0&&<div className="all-results-done"><Check size={17}/> Todos os pilotos já possuem resultado nesta corrida.</div>}</div>
        <div className="result-bulk-footer"><span>Pontuação padrão: Sprint 10–8–6–5–4–3–2–1 · Feature 25–18–15–12–10–8–6–4–2–1.</span><button className="primary-button" disabled={!filled} onClick={saveResults}><Check size={16}/> Salvar {filled||""} resultado(s)</button></div>
      </div>
      <div className="panel table-panel result-recorded-panel"><div className="panel-head"><div><h2>Resultados da corrida selecionada</h2><p>{selectedRace?.name} · {session==="Sprint"?"Sprint Race":"Feature Race"}</p></div></div><div className="table-wrap"><table><thead><tr><th>POS.</th><th>PILOTO</th><th>EQUIPE</th><th>SITUAÇÃO</th><th>PTS</th></tr></thead><tbody>{sessionResults.length===0?<tr><td colSpan={5} className="empty-state">Nenhum resultado registrado para esta corrida.</td></tr>:sessionResults.slice().sort((a,b)=>(a.position??99)-(b.position??99)).map(r=><tr key={r.id}><td><b className="champ-position">{r.position?r.position+"º":"—"}</b></td><td><button type="button" className="driver-name-link" onClick={()=>setProfileDriverId(r.driverId)}>{drivers.find(d=>d.id===r.driverId)?.name??"Piloto removido"}</button></td><td><button type="button" className="driver-name-link" onClick={()=>setProfileTeamId(drivers.find(d=>d.id===r.driverId)?.teamId??"")}>{teamName(drivers.find(d=>d.id===r.driverId)?.teamId??"")}</button></td><td>{r.status}</td><td><b className="champ-points">{r.points}</b></td></tr>)}</tbody></table></div></div>
    </div>}
    <div className="champ-footnote"><Medal size={14}/> Pontuação padrão: Sprint 10–8–6–5–4–3–2–1 · Feature 25–18–15–12–10–8–6–4–2–1. Resultados inseridos manualmente para sua simulação.</div>
    </>}
  </div>;
}
