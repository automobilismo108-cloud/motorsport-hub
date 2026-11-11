"use client";

import { useMemo, useState } from "react";
import { useCloudState } from "@/lib/useCloudState";
import Championship from "./components/Championship";
import Formula2Championship from "./components/Formula2Championship";
import Formula3Championship from "./components/Formula3Championship";
import {
  Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ArrowLeft, Bell, CarFront,
  ChevronDown, CircleDollarSign, Flag, Gauge, LayoutDashboard, Menu,
  Plus, Search, Settings, Shield, Trophy, Users, X, Check, Zap
} from "lucide-react";

type Team = { id: string; name: string; color: string; short: string };
type Driver = { id: string; name: string; country: string; number: number; teamId: string; status: "Titular" | "Reserva" };
type Move = { id: number; driver: string; from: string; to: string; date: string; status: string };

const initialTeams: Team[] = [
  { id:"mcl", name:"McLaren", short:"MCL", color:"#ff8700" },
  { id:"mer", name:"Mercedes", short:"MER", color:"#00a19b" },
  { id:"red", name:"Red Bull Racing", short:"RBR", color:"#3671c6" },
  { id:"fer", name:"Ferrari", short:"FER", color:"#e8002d" },
  { id:"wil", name:"Williams", short:"WIL", color:"#1868db" },
  { id:"rb", name:"Racing Bulls", short:"VCARB", color:"#6692ff" },
  { id:"ast", name:"Aston Martin", short:"AMR", color:"#229971" },
  { id:"has", name:"Haas", short:"HAA", color:"#b6babd" },
  { id:"aud", name:"Audi", short:"AUD", color:"#d71920" },
  { id:"alp", name:"Alpine", short:"ALP", color:"#ff87bc" },
  { id:"cad", name:"Cadillac", short:"CAD", color:"#d5d5d5" },
];

const teamDetails: Record<string, { headquarters: string; power: number; downforce: number }> = {
  mcl: { headquarters:"Woking, Inglaterra", power:94, downforce:95 },
  mer: { headquarters:"Brackley, Inglaterra", power:96, downforce:92 },
  red: { headquarters:"Milton Keynes, Inglaterra", power:95, downforce:94 },
  fer: { headquarters:"Maranello, Itália", power:93, downforce:93 },
  wil: { headquarters:"Grove, Inglaterra", power:91, downforce:88 },
  rb: { headquarters:"Faenza, Itália", power:91, downforce:87 },
  ast: { headquarters:"Silverstone, Inglaterra", power:90, downforce:91 },
  has: { headquarters:"Kannapolis, Estados Unidos", power:90, downforce:87 },
  aud: { headquarters:"Hinwil, Suíça", power:91, downforce:89 },
  alp: { headquarters:"Enstone, Inglaterra", power:92, downforce:89 },
  cad: { headquarters:"Fishers, Indiana, Estados Unidos", power:87, downforce:85 },
};

const driverDetails: Record<string, { age: number; contractUntil: number | null; attributes: { racePace: number; qualifying: number; overtaking: number; defending: number; consistency: number } }> = {
  "Lando Norris": { age:26, contractUntil:2030, attributes:{racePace:97,qualifying:97,overtaking:91,defending:91,consistency:96} },
  "Oscar Piastri": { age:25, contractUntil:2028, attributes:{racePace:96,qualifying:96,overtaking:93,defending:94,consistency:95} },
  "George Russell": { age:28, contractUntil:2027, attributes:{racePace:94,qualifying:95,overtaking:88,defending:91,consistency:94} },
  "Kimi Antonelli": { age:20, contractUntil:2027, attributes:{racePace:88,qualifying:91,overtaking:86,defending:82,consistency:82} },
  "Max Verstappen": { age:29, contractUntil:2030, attributes:{racePace:100,qualifying:99,overtaking:98,defending:99,consistency:98} },
  "Isack Hadjar": { age:22, contractUntil:2027, attributes:{racePace:88,qualifying:89,overtaking:85,defending:84,consistency:83} },
  "Charles Leclerc": { age:29, contractUntil:2028, attributes:{racePace:94,qualifying:98,overtaking:88,defending:91,consistency:90} },
  "Lewis Hamilton": { age:41, contractUntil:2027, attributes:{racePace:92,qualifying:91,overtaking:96,defending:97,consistency:94} },
  "Alexander Albon": { age:30, contractUntil:2027, attributes:{racePace:91,qualifying:90,overtaking:89,defending:93,consistency:94} },
  "Carlos Sainz": { age:32, contractUntil:2028, attributes:{racePace:93,qualifying:92,overtaking:92,defending:94,consistency:96} },
  "Liam Lawson": { age:24, contractUntil:2026, attributes:{racePace:85,qualifying:86,overtaking:88,defending:87,consistency:82} },
  "Arvid Lindblad": { age:19, contractUntil:2026, attributes:{racePace:80,qualifying:83,overtaking:82,defending:78,consistency:76} },
  "Fernando Alonso": { age:45, contractUntil:2027, attributes:{racePace:95,qualifying:93,overtaking:98,defending:99,consistency:97} },
  "Lance Stroll": { age:28, contractUntil:2027, attributes:{racePace:83,qualifying:82,overtaking:83,defending:85,consistency:80} },
  "Esteban Ocon": { age:30, contractUntil:2026, attributes:{racePace:88,qualifying:87,overtaking:89,defending:92,consistency:86} },
  "Oliver Bearman": { age:21, contractUntil:2026, attributes:{racePace:88,qualifying:91,overtaking:88,defending:85,consistency:84} },
  "Nico Hülkenberg": { age:39, contractUntil:2027, attributes:{racePace:90,qualifying:91,overtaking:87,defending:91,consistency:92} },
  "Gabriel Bortoleto": { age:22, contractUntil:2027, attributes:{racePace:86,qualifying:88,overtaking:85,defending:84,consistency:84} },
  "Pierre Gasly": { age:30, contractUntil:2028, attributes:{racePace:91,qualifying:91,overtaking:87,defending:89,consistency:92} },
  "Franco Colapinto": { age:23, contractUntil:2027, attributes:{racePace:83,qualifying:85,overtaking:85,defending:81,consistency:78} },
  "Sergio Pérez": { age:36, contractUntil:2029, attributes:{racePace:91,qualifying:88,overtaking:95,defending:96,consistency:91} },
  "Valtteri Bottas": { age:37, contractUntil:2027, attributes:{racePace:89,qualifying:92,overtaking:86,defending:89,consistency:93} },
};

const initialDriversSeed: Driver[] = [
  {id:"d1",name:"Lando Norris",country:"Reino Unido",number:1,teamId:"mcl",status:"Titular"},
  {id:"d2",name:"Oscar Piastri",country:"Austrália",number:81,teamId:"mcl",status:"Titular"},
  {id:"d3",name:"George Russell",country:"Reino Unido",number:63,teamId:"mer",status:"Titular"},
  {id:"d4",name:"Kimi Antonelli",country:"Itália",number:12,teamId:"mer",status:"Titular"},
  {id:"d5",name:"Max Verstappen",country:"Países Baixos",number:3,teamId:"red",status:"Titular"},
  {id:"d6",name:"Isack Hadjar",country:"França",number:6,teamId:"red",status:"Titular"},
  {id:"d7",name:"Charles Leclerc",country:"Mônaco",number:16,teamId:"fer",status:"Titular"},
  {id:"d8",name:"Lewis Hamilton",country:"Reino Unido",number:44,teamId:"fer",status:"Titular"},
  {id:"d9",name:"Alexander Albon",country:"Tailândia",number:23,teamId:"wil",status:"Titular"},
  {id:"d10",name:"Carlos Sainz",country:"Espanha",number:55,teamId:"wil",status:"Titular"},
  {id:"d11",name:"Liam Lawson",country:"Nova Zelândia",number:30,teamId:"rb",status:"Titular"},
  {id:"d12",name:"Arvid Lindblad",country:"Reino Unido",number:41,teamId:"rb",status:"Titular"},
  {id:"d13",name:"Fernando Alonso",country:"Espanha",number:14,teamId:"ast",status:"Titular"},
  {id:"d14",name:"Lance Stroll",country:"Canadá",number:18,teamId:"ast",status:"Titular"},
  {id:"d15",name:"Esteban Ocon",country:"França",number:31,teamId:"has",status:"Titular"},
  {id:"d16",name:"Oliver Bearman",country:"Reino Unido",number:87,teamId:"has",status:"Titular"},
  {id:"d17",name:"Nico Hülkenberg",country:"Alemanha",number:27,teamId:"aud",status:"Titular"},
  {id:"d18",name:"Gabriel Bortoleto",country:"Brasil",number:5,teamId:"aud",status:"Titular"},
  {id:"d19",name:"Pierre Gasly",country:"França",number:10,teamId:"alp",status:"Titular"},
  {id:"d20",name:"Franco Colapinto",country:"Argentina",number:43,teamId:"alp",status:"Titular"},
  {id:"d21",name:"Sergio Pérez",country:"México",number:11,teamId:"cad",status:"Titular"},
  {id:"d22",name:"Valtteri Bottas",country:"Finlândia",number:77,teamId:"cad",status:"Titular"},
];

const migrateDrivers = (legacy: any): Driver[] | undefined =>
  Array.isArray(legacy?.drivers) ? legacy.drivers : undefined;
const migrateMoves = (legacy: any): Move[] | undefined =>
  Array.isArray(legacy?.moves) ? legacy.moves : undefined;

const registeredChampionships = [
  { id:"f1", name:"FIA Formula One World Championship", category:"Fórmula 1", season:"2026", organizer:"FIA", description:"Classificação de pilotos e construtores, calendário e resultados da temporada.", status:"Em andamento", rounds:24 },
  { id:"f2", name:"FIA Formula 2 Championship", category:"Fórmula 2", season:"2026", organizer:"FIA", description:"Classificação de pilotos e equipes, calendário com Sprint e Feature Race e lançamento de resultados.", status:"Em andamento", rounds:14 },
  { id:"f3", name:"FIA Formula 3 Championship", category:"Fórmula 3", season:"2026", organizer:"FIA", description:"Classificação de pilotos e equipes, calendário com Sprint e Feature Race e lançamento de resultados.", status:"Em andamento", rounds:10 },
];

const initialMoves: Move[] = [
  {id:1,driver:"Isack Hadjar",from:"Racing Bulls",to:"Red Bull Racing",date:"2026",status:"Concluída"},
  {id:2,driver:"Arvid Lindblad",from:"Fórmula 2",to:"Racing Bulls",date:"2026",status:"Concluída"},
  {id:3,driver:"Gabriel Bortoleto",from:"Sauber",to:"Audi",date:"2026",status:"Concluída"},
];

export default function Home() {
  const [section, setSection] = useState("Visão geral");
  const [selectedChampionship, setSelectedChampionship] = useState<string | null>(null);
  const [drivers, setDrivers, driversReady, driversError] = useCloudState<Driver[]>("workspace:drivers", initialDriversSeed, "motorsport-hub:workspace:v1", migrateDrivers);
  const [teams] = useState(initialTeams);
  const [moves, setMoves, movesReady, movesError] = useCloudState<Move[]>("workspace:moves", initialMoves, "motorsport-hub:workspace:v1", migrateMoves);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [profileDriverId, setProfileDriverId] = useState<string | null>(null);
  const [profileTeamId, setProfileTeamId] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);


  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? "Sem equipe";
  const openDriverProfile = (id: string) => { setProfileTeamId(null); setProfileDriverId(id); };
  const openTeamProfile = (id: string) => { setProfileDriverId(null); setProfileTeamId(id); };
  const profileDriver = drivers.find(d => d.id === profileDriverId);
  const profileTeam = teams.find(t => t.id === profileTeamId);
  const profileTeamDrivers = profileTeam ? drivers.filter(d => d.teamId === profileTeam.id) : [];
  const profileDetails = profileDriver ? driverDetails[profileDriver.name] : undefined;
  const filteredDrivers = useMemo(() => drivers.filter(d =>
    `${d.name} ${teamName(d.teamId)} ${d.country}`.toLowerCase().includes(search.toLowerCase())
  ), [drivers, search, teams]);

  const doTransfer = () => {
    const driver = drivers.find(d => d.id === selectedDriver);
    const target = teams.find(t => t.id === destination);
    if (!driver || !target) return;
    if (driver.teamId === target.id) { setNotice("Este piloto já pertence a essa equipe."); return; }
    const occupants = drivers.filter(d => d.teamId === target.id && d.status === "Titular");
    if (occupants.length >= 2) { setNotice(`${target.name} já possui dois titulares. Libere uma vaga antes de concluir.`); return; }
    const from = teamName(driver.teamId);
    setDrivers(old => old.map(d => d.id === driver.id ? {...d, teamId: target.id} : d));
    setMoves(old => [{id:Date.now(),driver:driver.name,from,to:target.name,date:"Simulação 2026",status:"Concluída"},...old]);
    setModal(false); setSelectedDriver(""); setDestination("");
    setNotice(`Transferência simulada: ${driver.name} → ${target.name}`);
    setSection("Mercado");
  };

  const nav = [
    {label:"Visão geral",icon:LayoutDashboard},
    {label:"Pilotos",icon:Users},
    {label:"Equipes",icon:Shield},
    {label:"Mercado",icon:ArrowLeftRight},
  ];

  if (driversError || movesError) return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#080d16",color:"#dce5f2"}}>{driversError || movesError}</div>;
  if (!driversReady || !movesReady) return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#080d16",color:"#dce5f2"}}>Sincronizando seus dados com segurança...</div>;

  return (
    <main className="shell">
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Flag size={21}/></div><div><b>MOTORSPORT</b><span>HUB <i>2026</i></span></div><button className="close-menu" onClick={()=>setMobileMenu(false)}><X/></button></div>
        <div className="workspace"><span className="live-dot"/> TEMPORADA ATIVA <b>2026</b></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>{nav.map(item=><button key={item.label} className={`nav-item ${section===item.label?"active":""}`} onClick={()=>{setSection(item.label);setSelectedChampionship(null);setMobileMenu(false)}}><item.icon size={18}/>{item.label}{item.label==="Mercado"&&<span className="nav-count">{moves.length}</span>}</button>)}</nav>
        <div className="nav-caption second">GERENCIAMENTO</div>
        <button className={`nav-item ${section==="Campeonatos"?"active":""}`} onClick={()=>{setSection("Campeonatos");setSelectedChampionship(null);setMobileMenu(false)}}><Trophy size={18}/>Campeonatos</button>
        <button className={`nav-item ${section==="Configurações"?"active":""}`} onClick={()=>{setSection("Configurações");setSelectedChampionship(null);setMobileMenu(false);setNotice("");}}><Settings size={18}/>Configurações</button>
        <div className="sidebar-bottom"><div className="avatar">MH</div><div><b>Administrador</b><span>Workspace pessoal</span></div><ChevronDown size={15}/></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><button className="mobile-trigger" onClick={()=>setMobileMenu(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{section}</b></div><div className="top-actions"><div className="season-pill"><span/> FIA F1 WORLD CHAMPIONSHIP</div><button className="icon-button" title="Notificações" onClick={()=>setNotice("Você está em dia com as notificações.")}><Bell size={18}/></button><div className="top-avatar">MH</div></div></header>

        <div className="content">
          {notice && <div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
          <div className="page-heading"><div><div className="eyebrow"><span className="live-dot"/> MOTORSPORT HUB / {section==="Campeonatos" ? (selectedChampionship ? "CAMPEONATO SELECIONADO" : "CENTRAL DE CAMPEONATOS") : "F1 2026"}</div><h1>{section==="Campeonatos" && selectedChampionship ? registeredChampionships.find(c=>c.id===selectedChampionship)?.name : section==="Visão geral"?"Visão geral":section}</h1><p>{section==="Visão geral"?"Central de comando da temporada 2026.":section==="Pilotos"?"Gerencie os 22 pilotos do grid da Fórmula 1.":section==="Equipes"?"Estrutura das equipes inscritas na temporada.":section==="Campeonatos"?(selectedChampionship?"Gerencie classificação, calendário e resultados deste campeonato.":"Selecione um campeonato para acessar sua área de gerenciamento."):"Acompanhe movimentações e simule o mercado de pilotos."}</p></div>{section!=="Campeonatos" && <button className="primary-button" onClick={()=>{setModal(true);setNotice("")}}><Plus size={17}/> Nova transferência</button>}</div>

          {section==="Campeonatos" && !selectedChampionship && <div className="championship-catalog"><div className="catalog-toolbar"><div><h2>Campeonatos cadastrados</h2><p>{registeredChampionships.length} campeonato(s) disponível(is) no sistema</p></div><span className="catalog-counter"><Trophy size={15}/>{String(registeredChampionships.length).padStart(2,"0")} ATIVO(S)</span></div><div className="catalog-grid">{registeredChampionships.map(champ=><button type="button" className="panel catalog-card" key={champ.id} onClick={()=>setSelectedChampionship(champ.id)}><div className="catalog-card-top"><span className="catalog-mark"><Trophy size={22}/></span><span className="status-tag">{champ.status}</span></div><span className="catalog-category">{champ.category} · {champ.organizer}</span><h3>{champ.name}</h3><p>{champ.description}</p><div className="catalog-card-footer"><span><b>{champ.season}</b><small>TEMPORADA</small></span><span><b>{champ.rounds}</b><small>ETAPAS</small></span><span className="catalog-open">Abrir campeonato <ArrowUpRight size={15}/></span></div></button>)}</div></div>}
          {((section==="Campeonatos" && selectedChampionship==="f1") || section==="Configurações") && <>{section==="Campeonatos" && <button className="champ-back-button" onClick={()=>setSelectedChampionship(null)}><ArrowLeft size={15}/> Voltar para todos os campeonatos</button>}<Championship drivers={drivers} teams={teams} settingsOnly={section==="Configurações"}/></>}
          {section==="Campeonatos" && selectedChampionship==="f2" && <><button className="champ-back-button" onClick={()=>setSelectedChampionship(null)}><ArrowLeft size={15}/> Voltar para todos os campeonatos</button><Formula2Championship/></>}
          {section==="Campeonatos" && selectedChampionship==="f3" && <><button className="champ-back-button" onClick={()=>setSelectedChampionship(null)}><ArrowLeft size={15}/> Voltar para todos os campeonatos</button><Formula3Championship/></>}
          {profileDriver && <div className="driver-profile-page">
            <button className="champ-back-button" onClick={()=>setProfileDriverId(null)}><ArrowLeft size={15}/> Voltar</button>
            <div className="panel driver-profile-hero">
              <div className="driver-profile-number">#{profileDriver.number}</div>
              <div className="driver-profile-heading"><span className="eyebrow">FICHA DO PILOTO</span><h2>{profileDriver.name}</h2><p>{profileDriver.country} · {teamName(profileDriver.teamId)} · {profileDriver.status}</p></div>
              <span className="status-tag">TEMPORADA 2026</span>
            </div>
            <div className="driver-facts-grid">
              <div className="panel driver-fact"><span>IDADE</span><b>{profileDetails?.age ?? "—"} anos</b></div>
              <div className="panel driver-fact"><span>NACIONALIDADE</span><b>{profileDriver.country}</b></div>
              <div className="panel driver-fact"><span>CONTRATO ATUAL</span><b>{profileDetails?.contractUntil ? `Até o fim de ${profileDetails.contractUntil}` : "Não divulgado"}</b></div>
            </div>
            <div className="panel driver-attributes-panel">
              <div className="panel-head"><div><h2>Atributos do piloto</h2><p>Avaliação de desempenho · escala de 0 a 100</p></div><span className="status-tag">AVALIAÇÃO 0–100</span></div>
              <div className="driver-attributes-list">
                {([{key:"racePace",label:"Race Pace"},{key:"qualifying",label:"Qualifying"},{key:"overtaking",label:"Overtaking"},{key:"defending",label:"Defending"},{key:"consistency",label:"Consistency"}] as const).map(attribute => <div className="driver-attribute-row" key={attribute.key}><div><b>{attribute.label}</b><strong>{(profileDetails?.attributes?.[attribute.key] ?? 0)}</strong></div><div className="driver-attribute-track"><i style={{width:`${profileDetails?.attributes?.[attribute.key] ?? 0}%`}}/></div></div>)}
              </div>
            </div>
          </div>}
          {profileTeam && <div className="team-profile-page">
            <button className="champ-back-button" onClick={()=>setProfileTeamId(null)}><ArrowLeft size={15}/> Voltar</button>
            <div className="panel team-profile-hero">
              <div className="team-profile-emblem" style={{background:profileTeam.color+"18",color:profileTeam.color,borderColor:profileTeam.color+"55"}}>{profileTeam.short}</div>
              <div className="driver-profile-heading"><span className="eyebrow">FICHA DA EQUIPE</span><h2>{profileTeam.name}</h2><p>Fórmula 1 · Temporada 2026</p></div>
              <span className="status-tag">EQUIPE INSCRITA</span>
            </div>
            <div className="driver-facts-grid">
              <div className="panel driver-fact"><span>SEDE DA EQUIPE</span><b>{teamDetails[profileTeam.id]?.headquarters ?? "Não informada"}</b></div>
              <div className="panel driver-fact"><span>PILOTOS CADASTRADOS</span><b>{profileTeamDrivers.length} / 2</b></div>
              <div className="panel driver-fact"><span>VAGAS DISPONÍVEIS</span><b>{Math.max(0,2-profileTeamDrivers.length)}</b></div>
            </div>
            <div className="panel driver-attributes-panel">
              <div className="panel-head"><div><h2>Atributos da equipe</h2><p>Avaliação estimada de desempenho · escala de 0 a 100</p></div><span className="status-tag">AVALIAÇÃO 0–100</span></div>
              <div className="driver-attributes-list">
                {([{key:"power",label:"Power"},{key:"downforce",label:"Downforce"}] as const).map(attribute => <div className="driver-attribute-row" key={attribute.key}><div><b>{attribute.label}</b><strong>{teamDetails[profileTeam.id]?.[attribute.key] ?? 0}</strong></div><div className="driver-attribute-track"><i style={{width:`${teamDetails[profileTeam.id]?.[attribute.key] ?? 0}%`}}/></div></div>)}
              </div>
            </div>
            <div className="panel team-profile-roster">
              <div className="panel-head"><div><h2>Dupla de pilotos</h2><p>Pilotos atualmente vinculados à equipe</p></div><span className="status-tag">{profileTeamDrivers.length} CADASTRADO(S)</span></div>
              <div className="team-profile-driver-list">{profileTeamDrivers.length ? profileTeamDrivers.map(d=><div className="team-profile-driver" key={d.id}><span className="driver-number">#{d.number}</span><div><button type="button" className="driver-name-link" onClick={()=>openDriverProfile(d.id)}>{d.name}</button><small>{d.country} · {d.status}</small></div><ArrowUpRight size={15}/></div>) : <div className="empty-state">Nenhum piloto vinculado a esta equipe.</div>}</div>
            </div>
          </div>}
          {!profileDriver && !profileTeam && section==="Visão geral" && <>
            <div className="stats-grid">
              <Stat icon={<Users/>} label="Pilotos cadastrados" value={String(drivers.length).padStart(2,"0")} foot="Grid da temporada 2026" tone="orange"/>
              <Stat icon={<Shield/>} label="Equipes" value="11" foot="Construtores inscritos" tone="blue"/>
              <Stat icon={<ArrowLeftRight/>} label="Movimentações" value={String(moves.length).padStart(2,"0")} foot="No histórico do sistema" tone="green"/>
              <Stat icon={<Gauge/>} label="Vagas titulares" value={String(Math.max(0,22-drivers.length)).padStart(2,"0")} foot="Limite de 2 por equipe" tone="purple"/>
            </div>
            <div className="dashboard-grid">
              <div className="panel roster-panel"><div className="panel-head"><div><h2>Grid da temporada</h2><p>Composição atual das equipes</p></div><button className="text-button" onClick={()=>setSection("Equipes")}>Ver equipes <ArrowUpRight size={14}/></button></div>
                <div className="team-list">{teams.map(t=>{const ds=drivers.filter(d=>d.teamId===t.id);return <div className="team-row" key={t.id}><div className="team-stripe" style={{background:t.color}}/><div className="team-monogram" style={{color:t.color}}>{t.short}</div><div className="team-info"><button type="button" className="driver-name-link team-name-link" onClick={()=>openTeamProfile(t.id)}>{t.name}</button><span>{ds.map(d=>d.name).join(" · ")||"Nenhum piloto titular"}</span></div><div className="seat-count">{ds.length}/2 <span>vagas</span></div></div>})}</div>
              </div>
              <div className="panel activity-panel"><div className="panel-head"><div><h2>Mercado recente</h2><p>Últimas movimentações registradas</p></div><Activity size={17} className="muted-icon"/></div>
                <div className="activity-list">{moves.slice(0,5).map(m=><div className="activity-item" key={m.id}><div className="activity-icon"><ArrowLeftRight size={16}/></div><div className="activity-copy"><button type="button" className="driver-name-link" onClick={()=>{const d=drivers.find(x=>x.name===m.driver);if(d)openDriverProfile(d.id)}}>{m.driver}</button><span>{m.from} <ArrowUpRight size={11}/> {m.to}</span><small>{m.date}</small></div><span className="status-tag">{m.status}</span></div>)}</div>
                <button className="wide-ghost" onClick={()=>setSection("Mercado")}>Abrir mercado <ArrowUpRight size={14}/></button>
              </div>
            </div>
          </>}

          {!profileDriver && !profileTeam && section==="Pilotos" && <div className="panel table-panel"><div className="panel-head"><div><h2>Todos os pilotos</h2><p>{filteredDrivers.length} registros encontrados</p></div><div className="search-box"><Search size={16}/><input placeholder="Buscar piloto ou equipe..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>NACIONALIDADE</th><th>Nº</th><th>EQUIPE</th><th>STATUS</th></tr></thead><tbody>{filteredDrivers.map(d=><tr key={d.id}><td><button type="button" className="driver-name-link" onClick={()=>openDriverProfile(d.id)}>{d.name}</button></td><td>{d.country}</td><td>#{d.number}</td><td><span className="team-cell"><i style={{background:teams.find(t=>t.id===d.teamId)?.color}}/><button type="button" className="driver-name-link team-name-link" onClick={()=>openTeamProfile(d.teamId)}>{teamName(d.teamId)}</button></span></td><td><span className="status-tag">Titular</span></td></tr>)}</tbody></table></div></div>}

          {!profileDriver && !profileTeam && section==="Equipes" && <div className="team-cards">{teams.map(t=>{const ds=drivers.filter(d=>d.teamId===t.id);return <div className="panel team-card" key={t.id}><div className="team-card-top"><div className="team-emblem" style={{background:t.color+"18",color:t.color}}>{t.short}</div><span className="seat-count">{ds.length}/2 vagas</span></div><h3><button type="button" className="driver-name-link team-name-link" onClick={()=>openTeamProfile(t.id)}>{t.name}</button></h3><div className="driver-pair">{ds.map(d=><div key={d.id}><span>#{d.number}</span><button type="button" className="driver-name-link" onClick={()=>openDriverProfile(d.id)}>{d.name}</button></div>)}</div><div className="seat-bar"><i style={{width:`${ds.length*50}%`,background:t.color}}/></div></div>})}</div>}

          {!profileDriver && !profileTeam && section==="Mercado" && <div className="panel table-panel"><div className="panel-head"><div><h2>Central de transferências</h2><p>Movimentações reais de referência e simulações locais</p></div><button className="primary-button compact" onClick={()=>setModal(true)}><Plus size={16}/> Nova transferência</button></div><div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>ORIGEM</th><th>DESTINO</th><th>DATA</th><th>SITUAÇÃO</th></tr></thead><tbody>{moves.map(m=><tr key={m.id}><td><button type="button" className="driver-name-link" onClick={()=>{const d=drivers.find(x=>x.name===m.driver);if(d)openDriverProfile(d.id)}}>{m.driver}</button></td><td>{m.from}</td><td><span className="team-cell"><ArrowUpRight size={14}/>{m.to}</span></td><td>{m.date}</td><td><span className="status-tag">{m.status}</span></td></tr>)}</tbody></table></div><div className="market-note"><Zap size={16}/><span>As transferências criadas nesta demonstração alteram o grid apenas no navegador. A persistência no banco será ligada na próxima etapa.</span></div></div>}
          <footer> MOTORSPORT HUB <span>•</span> DADOS DE REFERÊNCIA: TEMPORADA 2026 <span>•</span> PROTÓTIPO 0.1</footer>
        </div>
      </section>

      {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="modal"><div className="modal-head"><div><span className="eyebrow">MERCADO DE PILOTOS</span><h2>Nova transferência</h2><p>Simule a mudança de equipe de um piloto.</p></div><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div><label>PILOTO<select value={selectedDriver} onChange={e=>setSelectedDriver(e.target.value)}><option value="">Selecione um piloto</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.name} — {teamName(d.teamId)}</option>)}</select></label><div className="transfer-arrow"><ArrowDownLeft size={18}/> DESTINO</div><label>NOVA EQUIPE<select value={destination} onChange={e=>setDestination(e.target.value)}><option value="">Selecione a equipe de destino</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div className="modal-hint">Regra do protótipo: cada equipe pode ter até dois pilotos titulares. A transferência é registrada no histórico.</div><div className="modal-actions"><button className="secondary-button" onClick={()=>setModal(false)}>Cancelar</button><button className="primary-button" disabled={!selectedDriver||!destination} onClick={doTransfer}><Check size={16}/> Confirmar simulação</button></div></div></div>}
    </main>
  );
}

function Stat({icon,label,value,foot,tone}:{icon:React.ReactNode,label:string,value:string,foot:string,tone:string}) {
  return <div className="panel stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong>{value}</strong><small>{foot}</small></div>;
}
