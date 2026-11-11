"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { ACTIVE_SEASON, REQUIRED_SUPER_LICENSE_POINTS, buildSuperLicenseAwards, getSuperLicensePoints, getSuperLicenseWindow, normalizeLicenseAwards, type SuperLicenseAward } from "@/lib/superLicense";
import { useCloudState } from "@/lib/useCloudState";
import { CalendarDays, ClipboardList, Flag, Medal, Trophy, Check, X } from "lucide-react";

type Driver = { id: string; licenseId: string; name: string; country: string; number: number; teamId: string };
type Team = { id: string; name: string; short: string; color: string; headquarters: string };
type Race = { id: number; round: number; name: string; circuit: string; date: string; status: "Programada" | "Concluída" };
type Result = { id: number; raceId: number; session: "Sprint" | "Feature"; driverId: string; position: number | null; points: number; status: string };

const teams: Team[] = [
  {id:"inv",name:"Invicta Racing",short:"INV",color:"#e6c84f",headquarters:"Attleborough, Norfolk, Reino Unido"},
  {id:"hit",name:"Hitech",short:"HIT",color:"#2477c8",headquarters:"Silverstone, Northamptonshire, Reino Unido"},
  {id:"cam",name:"Campos Racing",short:"CAM",color:"#e23d3d",headquarters:"Alzira, Valência, Espanha"},
  {id:"dam",name:"DAMS Lucas Oil",short:"DAMS",color:"#f0f0f0",headquarters:"Ruaudin (região de Le Mans), França"},
  {id:"mp",name:"MP Motorsport",short:"MP",color:"#f3a52d",headquarters:"Westmaas, Países Baixos"},
  {id:"pre",name:"PREMA Racing",short:"PRE",color:"#f5f5f5",headquarters:"Grisignano di Zocco, Vicenza, Itália"},
  {id:"rod",name:"Rodin Motorsport",short:"ROD",color:"#43a6a0",headquarters:"Farnham, Surrey, Reino Unido"},
  {id:"art",name:"ART Grand Prix",short:"ART",color:"#6a9bd6",headquarters:"Saint-Pierre-du-Perray, França"},
  {id:"aix",name:"AIX Racing",short:"AIX",color:"#d9a7e8",headquarters:"Andernach, Alemanha"},
  {id:"var",name:"Van Amersfoort Racing",short:"VAR",color:"#e8e8e8",headquarters:"Zeewolde, Países Baixos"},
  {id:"tri",name:"TRIDENT",short:"TRI",color:"#238b5b",headquarters:"Ossona, região de Milão, Itália"},
];

const drivers: Driver[] = [
  {id:"f2-1",licenseId:"driver:rafael-camara",name:"Rafael Câmara",country:"Brasil",number:1,teamId:"inv"},
  {id:"f2-2",licenseId:"driver:joshua-durksen",name:"Joshua Dürksen",country:"Paraguai",number:2,teamId:"inv"},
  {id:"f2-3",licenseId:"driver:ritomo-miyata",name:"Ritomo Miyata",country:"Japão",number:3,teamId:"hit"},
  {id:"f2-4",licenseId:"driver:colton-herta",name:"Colton Herta",country:"Estados Unidos",number:4,teamId:"hit"},
  {id:"f2-5",licenseId:"driver:noel-leon",name:"Noel León",country:"México",number:5,teamId:"cam"},
  {id:"f2-6",licenseId:"driver:nikola-tsolov",name:"Nikola Tsolov",country:"Bulgária",number:6,teamId:"cam"},
  {id:"f2-7",licenseId:"driver:dino-beganovic",name:"Dino Beganovic",country:"Suécia",number:7,teamId:"dam"},
  {id:"f2-8",licenseId:"driver:roman-bilinski",name:"Roman Bilinski",country:"Polônia",number:8,teamId:"dam"},
  {id:"f2-9",licenseId:"driver:gabriele-mini",name:"Gabriele Minì",country:"Itália",number:9,teamId:"mp"},
  {id:"f2-10",licenseId:"driver:oliver-goethe",name:"Oliver Goethe",country:"Alemanha",number:10,teamId:"mp"},
  {id:"f2-11",licenseId:"driver:sebastian-montoya",name:"Sebastián Montoya",country:"Colômbia",number:11,teamId:"pre"},
  {id:"f2-12",licenseId:"driver:mari-boya",name:"Mari Boya",country:"Espanha",number:12,teamId:"pre"},
  {id:"f2-14",licenseId:"driver:martinius-stenshorne",name:"Martinius Stenshorne",country:"Noruega",number:14,teamId:"rod"},
  {id:"f2-15",licenseId:"driver:alexander-dunne",name:"Alexander Dunne",country:"Irlanda",number:15,teamId:"rod"},
  {id:"f2-16",licenseId:"driver:kush-maini",name:"Kush Maini",country:"Índia",number:16,teamId:"art"},
  {id:"f2-17",licenseId:"driver:tasanapol-inthraphuvasak",name:"Tasanapol Inthraphuvasak",country:"Tailândia",number:17,teamId:"art"},
  {id:"f2-20",licenseId:"driver:emerson-fittipaldi",name:"Emerson Fittipaldi",country:"Brasil",number:20,teamId:"aix"},
  {id:"f2-21",licenseId:"driver:cian-shields",name:"Cian Shields",country:"Reino Unido",number:21,teamId:"aix"},
  {id:"f2-22",licenseId:"driver:hiyu-yamakoshi",name:"Hiyu Yamakoshi",country:"Japão",number:22,teamId:"var"},
  {id:"f2-23",licenseId:"driver:rafael-villagomez",name:"Rafael Villagómez",country:"México",number:23,teamId:"var"},
  {id:"f2-24",licenseId:"driver:laurens-van-hoepen",name:"Laurens van Hoepen",country:"Países Baixos",number:24,teamId:"tri"},
  {id:"f2-25",licenseId:"driver:john-bennett",name:"John Bennett",country:"Reino Unido",number:25,teamId:"tri"},
];

const initialRaces: Race[] = [
  {id:1,round:1,name:"GP da Austrália",circuit:"Albert Park — Melbourne",date:"06–08 mar 2026",status:"Programada"},
  {id:2,round:2,name:"GP de Miami",circuit:"Miami International Autodrome",date:"01–03 mai 2026",status:"Programada"},
  {id:3,round:3,name:"GP do Canadá",circuit:"Circuit Gilles-Villeneuve — Montréal",date:"22–24 mai 2026",status:"Programada"},
  {id:4,round:4,name:"GP de Mônaco",circuit:"Circuit de Monaco",date:"04–07 jun 2026",status:"Programada"},
  {id:5,round:5,name:"GP da Espanha",circuit:"Circuit de Barcelona-Catalunya",date:"12–14 jun 2026",status:"Programada"},
  {id:6,round:6,name:"GP da Áustria",circuit:"Red Bull Ring — Spielberg",date:"26–28 jun 2026",status:"Programada"},
  {id:7,round:7,name:"GP da Grã-Bretanha",circuit:"Silverstone Circuit",date:"03–05 jul 2026",status:"Programada"},
  {id:8,round:8,name:"GP da Bélgica",circuit:"Circuit de Spa-Francorchamps",date:"17–19 jul 2026",status:"Programada"},
  {id:9,round:9,name:"GP da Hungria",circuit:"Hungaroring — Budapeste",date:"24–26 jul 2026",status:"Programada"},
  {id:10,round:10,name:"GP da Itália",circuit:"Autodromo Nazionale Monza",date:"04–06 set 2026",status:"Programada"},
  {id:11,round:11,name:"GP de Madrid",circuit:"Madring — Madrid",date:"11–13 set 2026",status:"Programada"},
  {id:12,round:12,name:"GP do Azerbaijão",circuit:"Baku City Circuit",date:"24–26 set 2026",status:"Programada"},
  {id:13,round:13,name:"GP do Catar",circuit:"Lusail International Circuit",date:"27–29 nov 2026",status:"Programada"},
  {id:14,round:14,name:"GP de Abu Dhabi",circuit:"Yas Marina Circuit",date:"04–06 dez 2026",status:"Programada"},
];

const teamDetails: Record<string, { power: number; downforce: number }> = {
  inv:{power:80,downforce:80}, hit:{power:80,downforce:80}, cam:{power:80,downforce:80},
  dam:{power:80,downforce:80}, mp:{power:80,downforce:80}, pre:{power:80,downforce:80},
  rod:{power:80,downforce:80}, art:{power:80,downforce:80}, aix:{power:80,downforce:80},
  var:{power:80,downforce:80}, tri:{power:80,downforce:80},
};

const driverDetails: Record<string, { age: number; attributes: { racePace: number; qualifying: number; overtaking: number; defending: number; consistency: number } }> = {
  "Rafael Câmara": { age:21, attributes:{racePace:84,qualifying:83,overtaking:80,defending:78,consistency:81} },
  "Joshua Dürksen": { age:22, attributes:{racePace:78,qualifying:75,overtaking:81,defending:79,consistency:74} },
  "Ritomo Miyata": { age:27, attributes:{racePace:78,qualifying:76,overtaking:74,defending:77,consistency:79} },
  "Colton Herta": { age:26, attributes:{racePace:82,qualifying:83,overtaking:84,defending:78,consistency:75} },
  "Noel León": { age:21, attributes:{racePace:77,qualifying:76,overtaking:78,defending:75,consistency:73} },
  "Nikola Tsolov": { age:19, attributes:{racePace:83,qualifying:81,overtaking:82,defending:77,consistency:78} },
  "Dino Beganovic": { age:22, attributes:{racePace:80,qualifying:79,overtaking:77,defending:78,consistency:79} },
  "Roman Bilinski": { age:22, attributes:{racePace:72,qualifying:70,overtaking:73,defending:72,consistency:68} },
  "Gabriele Minì": { age:21, attributes:{racePace:82,qualifying:84,overtaking:79,defending:77,consistency:78} },
  "Oliver Goethe": { age:22, attributes:{racePace:77,qualifying:78,overtaking:76,defending:73,consistency:75} },
  "Sebastián Montoya": { age:21, attributes:{racePace:75,qualifying:77,overtaking:76,defending:72,consistency:70} },
  "Mari Boya": { age:22, attributes:{racePace:73,qualifying:74,overtaking:72,defending:75,consistency:73} },
  "Martinius Stenshorne": { age:20, attributes:{racePace:82,qualifying:80,overtaking:81,defending:76,consistency:77} },
  "Alexander Dunne": { age:21, attributes:{racePace:83,qualifying:82,overtaking:84,defending:81,consistency:76} },
  "Kush Maini": { age:26, attributes:{racePace:78,qualifying:76,overtaking:77,defending:80,consistency:78} },
  "Tasanapol Inthraphuvasak": { age:20, attributes:{racePace:72,qualifying:71,overtaking:74,defending:70,consistency:68} },
  "Emerson Fittipaldi": { age:19, attributes:{racePace:68,qualifying:70,overtaking:69,defending:67,consistency:65} },
  "Cian Shields": { age:21, attributes:{racePace:65,qualifying:66,overtaking:68,defending:65,consistency:63} },
  "Hiyu Yamakoshi": { age:20, attributes:{racePace:67,qualifying:68,overtaking:69,defending:65,consistency:64} },
  "Rafael Villagómez": { age:25, attributes:{racePace:70,qualifying:68,overtaking:72,defending:69,consistency:67} },
  "Laurens van Hoepen": { age:21, attributes:{racePace:78,qualifying:77,overtaking:79,defending:75,consistency:76} },
  "John Bennett": { age:23, attributes:{racePace:69,qualifying:68,overtaking:70,defending:67,consistency:65} },
};

const sprintPoints = [10,8,6,5,4,3,2,1];
const featurePoints = [25,18,15,12,10,8,6,4,2,1];

export default function Formula2Championship() {
  const [tab,setTab] = useState<"classificacao"|"calendario"|"resultados">("classificacao");
  const [races,setRaces,racesReady,racesError] = useCloudState<Race[]>(`championship:f2:${ACTIVE_SEASON}:races`,initialRaces);
  const [results,setResults,resultsReady,resultsError] = useCloudState<Result[]>(`championship:f2:${ACTIVE_SEASON}:results`,[]);
  const [licenseAwards,setLicenseAwards,licenseReady,licenseError] = useCloudState<SuperLicenseAward[]>("superlicense:awards",[]);
  const { user } = useAuth();
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
  const normalizedLicenseAwards = normalizeLicenseAwards(licenseAwards);
  const licenseWindow = getSuperLicenseWindow();
  const seasonAlreadyFinalized = normalizedLicenseAwards.some(a => a.category === "F2" && a.season === ACTIVE_SEASON);
  const seasonComplete = races.length > 0 && races.every(r =>
    (["Sprint", "Feature"] as const).every(kind =>
      drivers.every(d => results.some(x => x.raceId === r.id && x.session === kind && x.driverId === d.id))
    )
  );
  const finalizeSeason = async () => {
    if (!licenseReady) { setNotice("Aguarde a sincronização da Superlicença."); return; }
    if (seasonAlreadyFinalized) { setNotice("Esta temporada já foi finalizada; os pontos não serão duplicados."); return; }
    if (!seasonComplete) { setNotice("Registre todos os pilotos em Sprint e Feature de todas as etapas antes de finalizar."); return; }
    if (!user || !supabase) { setNotice("Não foi possível confirmar sua sessão para salvar a Superlicença."); return; }
    const awards = buildSuperLicenseAwards("F2", ACTIVE_SEASON, drivers, results);
    if (!awards.length) { setNotice("Não foi possível gerar a classificação final."); return; }
    const { error: resultsSaveError } = await supabase.from("workspace_data").upsert(
      { user_id: user.id, data_key: `championship:f2:${ACTIVE_SEASON}:results`, payload: results },
      { onConflict: "user_id,data_key" }
    );
    if (resultsSaveError) { setNotice("Não foi possível salvar os resultados antes da Superlicença: " + resultsSaveError.message); return; }
    const nextAwards = [...normalizedLicenseAwards.filter(a => !(a.category === "F2" && a.season === ACTIVE_SEASON)), ...awards];
    const { error } = await supabase.from("workspace_data").upsert(
      { user_id: user.id, data_key: "superlicense:awards", payload: nextAwards },
      { onConflict: "user_id,data_key" }
    );
    if (error) { setNotice("Falha ao salvar a Superlicença: " + error.message); return; }
    setLicenseAwards(nextAwards);
    setNotice("Classificação final da Fórmula 2 " + ACTIVE_SEASON + " confirmada. Pontos salvos na nuvem.");
  };
  const profileLicensePoints = getSuperLicensePoints(normalizedLicenseAwards, profileDriver?.licenseId);
  const profileLicenseEligible = profileLicensePoints >= REQUIRED_SUPER_LICENSE_POINTS;

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

  if(racesError||resultsError||licenseError)return <div className="notice">Não foi possível sincronizar os dados da Fórmula 2.</div>;
  if(!racesReady||!resultsReady||!licenseReady)return <div className="panel" style={{padding:20,color:"#aeb9c7"}}>Sincronizando os dados da Fórmula 2...</div>;

  return <div className="championship-module">
    {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    {profileTeam ? <div className="driver-profile-page">
      <button className="champ-back-button" onClick={()=>setProfileTeamId(null)}><Flag size={15}/> Voltar ao campeonato</button>
      <div className="panel driver-profile-hero">
        <div className="driver-profile-number" style={{color:profileTeam.color}}>F2</div>
        <div className="driver-profile-heading"><span className="eyebrow">FICHA DA EQUIPE · FÓRMULA 2</span><h2>{profileTeam.name}</h2><p>{profileTeam.headquarters} · Temporada {ACTIVE_SEASON}</p></div>
        <span className="status-tag">EQUIPE F2</span>
      </div>
      <div className="driver-facts-grid">
        <div className="panel driver-fact"><span>SEDE</span><b>{profileTeam.headquarters}</b></div>
        <div className="panel driver-fact"><span>PILOTOS</span><b>{drivers.filter(d=>d.teamId===profileTeam.id).length} inscritos</b></div>
        <div className="panel driver-fact"><span>CAMPEONATO</span><b>FIA Formula 2 · 2026</b></div>
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
        <div className="driver-profile-heading"><span className="eyebrow">FICHA DO PILOTO · FÓRMULA 2</span><h2>{profileDriver.name}</h2><p>{profileDriver.country} · <button type="button" className="driver-name-link" onClick={()=>{setProfileDriverId(null);setProfileTeamId(profileDriver.teamId);}}>{teamName(profileDriver.teamId)}</button> · Temporada 2026</p></div>
        <span className="status-tag">EM DESENVOLVIMENTO</span>
      </div>
      <div className="driver-facts-grid">
        <div className="panel driver-fact"><span>IDADE</span><b>{profileDetails?.age ?? "—"} anos</b></div>
        <div className="panel driver-fact"><span>NACIONALIDADE</span><b>{profileDriver.country}</b></div>
        <div className="panel driver-fact"><span>EQUIPE ATUAL</span><b><button type="button" className="driver-name-link" onClick={()=>{setProfileDriverId(null);setProfileTeamId(profileDriver.teamId);}}>{teamName(profileDriver.teamId)}</button></b></div>
      </div>
      <div className="panel driver-attributes-panel">
        <div className="panel-head"><div><h2>Superlicença FIA</h2><p>Pontos acumulados nas últimas três temporadas ({licenseWindow.join("–")})</p></div><span className="status-tag">{profileLicenseEligible?"LICENCIADO":"EM FORMAÇÃO"}</span></div>
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
    <div className="champ-hero panel"><div className="champ-hero-icon"><Trophy size={23}/></div><div className="champ-hero-copy"><span className="eyebrow">CAMPEONATO ATIVO</span><h2>FIA Formula 2 Championship</h2><p>Temporada {ACTIVE_SEASON} · Fórmula 2 · Corrida Sprint e Feature</p></div><div className="champ-progress"><b>{String(completed).padStart(2,"0")} <span>/ {String(races.length).padStart(2,"0")}</span></b><small>ETAPAS COM RESULTADO</small></div></div>
    <div className="champ-tabs">
      <button className={tab==="classificacao"?"selected":""} onClick={()=>setTab("classificacao")}><Trophy size={15}/> Classificação</button>
      <button className={tab==="calendario"?"selected":""} onClick={()=>setTab("calendario")}><CalendarDays size={15}/> Calendário</button>
      <button className={tab==="resultados"?"selected":""} onClick={()=>setTab("resultados")}><ClipboardList size={15}/> Resultados</button>
    </div>
    {tab==="classificacao"&&<div className="panel table-panel" style={{marginBottom:16,padding:20}}>
      <div className="panel-head"><div><h2>Superlicença FIA · Temporada {ACTIVE_SEASON}</h2><p>Fórmula 2: pontos para os 10 primeiros após a confirmação da classificação final.</p></div><span className="status-tag">{seasonAlreadyFinalized?"FINALIZADA":seasonComplete?"PRONTA PARA FINALIZAR":"EM ANDAMENTO"}</span></div>
      <div className="result-bulk-footer"><span>{seasonAlreadyFinalized?"Pontos já registrados.":seasonComplete?"Todos os resultados foram preenchidos. Confirme para creditar os pontos.":"Complete Sprint e Feature de todas as etapas para habilitar a confirmação."}</span><button className="primary-button" disabled={!seasonComplete||seasonAlreadyFinalized||!licenseReady||!!licenseError} onClick={finalizeSeason}><Check size={16}/> Confirmar classificação final</button></div>
      {licenseError&&<p className="empty-state">Não foi possível sincronizar a Superlicença.</p>}
    </div>}
    {tab==="classificacao"&&<div className="champ-standings-grid">
      <div className="panel table-panel"><div className="panel-head"><div><h2>Campeonato de pilotos</h2><p>Pontuação acumulada nas corridas Sprint e Feature</p></div><span className="status-tag">22 PILOTOS</span></div><div className="table-wrap"><table><thead><tr><th>POS.</th><th>PILOTO</th><th>EQUIPE</th><th>VITÓRIAS</th><th>PÓDIOS</th><th>PTS</th></tr></thead><tbody>{standings.map((d,i)=><tr key={d.id}><td><b className="champ-position">{String(i+1).padStart(2,"0")}</b></td><td><button type="button" className="driver-name-link" onClick={()=>setProfileDriverId(d.id)}>{d.name}</button></td><td><span className="team-cell"><i style={{background:teamColor(d.teamId)}}/><button type="button" className="driver-name-link" onClick={()=>setProfileTeamId(d.teamId)}>{teamName(d.teamId)}</button></span></td><td>{d.wins}</td><td>{d.podiums}</td><td><b className="champ-points">{d.points}</b></td></tr>)}</tbody></table></div></div>
      <div className="panel table-panel"><div className="panel-head"><div><h2>Campeonato de equipes</h2><p>Soma dos pontos dos dois pilotos</p></div><span className="status-tag">11 EQUIPES</span></div><div className="constructor-list">{teamStandings.map((t,i)=><div className="constructor-row" key={t.id}><b className="champ-position">{String(i+1).padStart(2,"0")}</b><i style={{background:t.color}}/><button type="button" className="driver-name-link" onClick={()=>setProfileTeamId(t.id)}>{t.name}</button><strong>{t.points} <small>PTS</small></strong></div>)}</div></div>
    </div>}
    {tab==="calendario"&&<div className="panel table-panel"><div className="panel-head"><div><h2>Calendário da temporada</h2><p>14 etapas · 28 corridas · Sprint e Feature</p></div></div><div className="table-wrap"><table><thead><tr><th>RODADA</th><th>ETAPA</th><th>CIRCUITO</th><th>DATA</th><th>STATUS</th></tr></thead><tbody>{races.slice().sort((a,b)=>a.round-b.round).map(r=><tr key={r.id}><td><b>R{String(r.round).padStart(2,"0")}</b></td><td><b>{r.name}</b></td><td>{r.circuit}</td><td>{r.date}</td><td><span className={r.status==="Concluída"?"status-tag":"race-pending"}>{r.status}</span></td></tr>)}</tbody></table></div></div>}
    {tab==="resultados"&&<div className="champ-results-workspace">
      <div className="panel result-entry">
        <div className="panel-head result-panel-heading"><div><h2>Lançar resultado da corrida</h2><p>Selecione a etapa e o tipo de corrida para registrar a classificação.</p></div><span className="status-tag">{sessionResults.length} REGISTRADOS</span></div>
        <div className="result-event-picker"><label>ETAPA DA TEMPORADA<select value={raceId} onChange={e=>{setRaceId(e.target.value);setDraft({});}}>{races.slice().sort((a,b)=>a.round-b.round).map(r=><option key={r.id} value={r.id}>R{String(r.round).padStart(2,"0")} · {r.name} — {r.circuit}</option>)}</select></label><label style={{maxWidth:190}}>TIPO DE CORRIDA<select value={session} onChange={e=>{setSession(e.target.value as "Sprint"|"Feature");setDraft({});}}><option value="Sprint">Sprint Race</option><option value="Feature">Feature Race</option></select></label><div className="result-event-meta"><span>{selectedRace?.date}</span><span>{remaining.length} pendentes</span></div></div>
        <div className="result-bulk-toolbar"><div><b>Ordem de chegada · {session==="Sprint"?"Sprint Race":"Feature Race"}</b><small>Deixe em branco quem ainda não deseja registrar.</small></div><span>{filled} preenchidos</span></div>
        <div className="result-driver-list">{remaining.map(d=>{const item=draft[d.id]??{position:"",status:"Classificado"};const scale=session==="Sprint"?sprintPoints:featurePoints;const pts=item.status==="Classificado"&&item.position!==""&&Number(item.position)<=scale.length?scale[Number(item.position)-1]:0;return <div className="result-driver-row" key={d.id}><div className="result-driver-identity"><span className="driver-number">{d.number}</span><div><button type="button" className="driver-name-link" onClick={()=>setProfileDriverId(d.id)}>{d.name}</button><small><button type="button" className="driver-name-link" onClick={()=>setProfileTeamId(d.teamId)}>{teamName(d.teamId)}</button></small></div></div><label className="result-position-field"><span>POSIÇÃO</span><select value={item.position} onChange={e=>setDraft(old=>({...old,[d.id]:{...item,position:e.target.value}}))}><option value="">—</option>{Array.from({length:22},(_,i)=><option key={i+1} value={String(i+1)}>{i+1}º</option>)}</select></label><label className="result-status-field"><span>SITUAÇÃO</span><select value={item.status} onChange={e=>setDraft(old=>({...old,[d.id]:{...item,status:e.target.value}}))}><option>Classificado</option><option>Abandono</option><option>Desclassificado</option><option>Não largou</option></select></label><b className="result-row-points">{pts} <small>PTS</small></b></div>})}{remaining.length===0&&<div className="all-results-done"><Check size={17}/> Todos os pilotos já possuem resultado nesta corrida.</div>}</div>
        <div className="result-bulk-footer"><span>Pontuação padrão: Sprint 10–8–6–5–4–3–2–1 · Feature 25–18–15–12–10–8–6–4–2–1.</span><button className="primary-button" disabled={!filled} onClick={saveResults}><Check size={16}/> Salvar {filled||""} resultado(s)</button></div>
      </div>
      <div className="panel table-panel result-recorded-panel"><div className="panel-head"><div><h2>Resultados da corrida selecionada</h2><p>{selectedRace?.name} · {session==="Sprint"?"Sprint Race":"Feature Race"}</p></div></div><div className="table-wrap"><table><thead><tr><th>POS.</th><th>PILOTO</th><th>EQUIPE</th><th>SITUAÇÃO</th><th>PTS</th></tr></thead><tbody>{sessionResults.length===0?<tr><td colSpan={5} className="empty-state">Nenhum resultado registrado para esta corrida.</td></tr>:sessionResults.slice().sort((a,b)=>(a.position??99)-(b.position??99)).map(r=><tr key={r.id}><td><b className="champ-position">{r.position?r.position+"º":"—"}</b></td><td><button type="button" className="driver-name-link" onClick={()=>setProfileDriverId(r.driverId)}>{drivers.find(d=>d.id===r.driverId)?.name??"Piloto removido"}</button></td><td><button type="button" className="driver-name-link" onClick={()=>setProfileTeamId(drivers.find(d=>d.id===r.driverId)?.teamId??"")}>{teamName(drivers.find(d=>d.id===r.driverId)?.teamId??"")}</button></td><td>{r.status}</td><td><b className="champ-points">{r.points}</b></td></tr>)}</tbody></table></div></div>
    </div>}
    <div className="champ-footnote"><Medal size={14}/> Pontuação padrão: Sprint 10–8–6–5–4–3–2–1 · Feature 25–18–15–12–10–8–6–4–2–1. Resultados inseridos manualmente para sua simulação.</div>
    </>}
  </div>;
}
