"use client";

import { useEffect, useMemo, useState } from "react";
import Championship from "./components/Championship";
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

const initialDrivers: Driver[] = [
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

const registeredChampionships = [
  { id:"f1", name:"FIA Formula One World Championship", category:"Fórmula 1", season:"2026", organizer:"FIA", description:"Classificação de pilotos e construtores, calendário e resultados da temporada.", status:"Em andamento", rounds:24 },
];

const initialMoves: Move[] = [
  {id:1,driver:"Isack Hadjar",from:"Racing Bulls",to:"Red Bull Racing",date:"2026",status:"Concluída"},
  {id:2,driver:"Arvid Lindblad",from:"Fórmula 2",to:"Racing Bulls",date:"2026",status:"Concluída"},
  {id:3,driver:"Gabriel Bortoleto",from:"Sauber",to:"Audi",date:"2026",status:"Concluída"},
];

export default function Home() {
  const [section, setSection] = useState("Visão geral");
  const [selectedChampionship, setSelectedChampionship] = useState<string | null>(null);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [teams] = useState(initialTeams);
  const [moves, setMoves] = useState(initialMoves);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [destination, setDestination] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("motorsport-hub:workspace:v1");
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.drivers)) setDrivers(data.drivers);
        if (Array.isArray(data.moves)) setMoves(data.moves);
      }
    } catch (error) { console.error("Não foi possível carregar os dados salvos.", error); }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem("motorsport-hub:workspace:v1", JSON.stringify({ drivers, moves })); }
    catch (error) { console.error("Não foi possível salvar os dados.", error); }
  }, [drivers, moves, storageReady]);

  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? "Sem equipe";
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

  return (
    <main className="shell">
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Flag size={21}/></div><div><b>MOTORSPORT</b><span>HUB <i>2026</i></span></div><button className="close-menu" onClick={()=>setMobileMenu(false)}><X/></button></div>
        <div className="workspace"><span className="live-dot"/> TEMPORADA ATIVA <b>2026</b></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>{nav.map(item=><button key={item.label} className={`nav-item ${section===item.label?"active":""}`} onClick={()=>{setSection(item.label);setSelectedChampionship(null);setMobileMenu(false)}}><item.icon size={18}/>{item.label}{item.label==="Mercado"&&<span className="nav-count">{moves.length}</span>}</button>)}</nav>
        <div className="nav-caption second">GERENCIAMENTO</div>
        <button className={`nav-item ${section==="Campeonatos"?"active":""}`} onClick={()=>{setSection("Campeonatos");setSelectedChampionship(null);setMobileMenu(false)}}><Trophy size={18}/>Campeonatos</button>
        <button className="nav-item" onClick={()=>setNotice("Configurações: em breve.")}><Settings size={18}/>Configurações</button>
        <div className="sidebar-bottom"><div className="avatar">MH</div><div><b>Administrador</b><span>Workspace pessoal</span></div><ChevronDown size={15}/></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><button className="mobile-trigger" onClick={()=>setMobileMenu(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{section}</b></div><div className="top-actions"><div className="season-pill"><span/> FIA F1 WORLD CHAMPIONSHIP</div><button className="icon-button" title="Notificações" onClick={()=>setNotice("Você está em dia com as notificações.")}><Bell size={18}/></button><div className="top-avatar">MH</div></div></header>

        <div className="content">
          {notice && <div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
          <div className="page-heading"><div><div className="eyebrow"><span className="live-dot"/> MOTORSPORT HUB / {section==="Campeonatos" ? (selectedChampionship ? "CAMPEONATO SELECIONADO" : "CENTRAL DE CAMPEONATOS") : "F1 2026"}</div><h1>{section==="Campeonatos" && selectedChampionship ? registeredChampionships.find(c=>c.id===selectedChampionship)?.name : section==="Visão geral"?"Visão geral":section}</h1><p>{section==="Visão geral"?"Central de comando da temporada 2026.":section==="Pilotos"?"Gerencie os 22 pilotos do grid da Fórmula 1.":section==="Equipes"?"Estrutura das equipes inscritas na temporada.":section==="Campeonatos"?(selectedChampionship?"Gerencie classificação, calendário e resultados deste campeonato.":"Selecione um campeonato para acessar sua área de gerenciamento."):"Acompanhe movimentações e simule o mercado de pilotos."}</p></div>{section!=="Campeonatos" && <button className="primary-button" onClick={()=>{setModal(true);setNotice("")}}><Plus size={17}/> Nova transferência</button>}</div>

          {section==="Campeonatos" && !selectedChampionship && <div className="championship-catalog"><div className="catalog-toolbar"><div><h2>Campeonatos cadastrados</h2><p>{registeredChampionships.length} campeonato(s) disponível(is) no sistema</p></div><span className="catalog-counter"><Trophy size={15}/>{String(registeredChampionships.length).padStart(2,"0")} ATIVO(S)</span></div><div className="catalog-grid">{registeredChampionships.map(champ=><button type="button" className="panel catalog-card" key={champ.id} onClick={()=>setSelectedChampionship(champ.id)}><div className="catalog-card-top"><span className="catalog-mark"><Trophy size={22}/></span><span className="status-tag">{champ.status}</span></div><span className="catalog-category">{champ.category} · {champ.organizer}</span><h3>{champ.name}</h3><p>{champ.description}</p><div className="catalog-card-footer"><span><b>{champ.season}</b><small>TEMPORADA</small></span><span><b>{champ.rounds}</b><small>ETAPAS</small></span><span className="catalog-open">Abrir campeonato <ArrowUpRight size={15}/></span></div></button>)}</div></div>}
          {section==="Campeonatos" && selectedChampionship==="f1" && <><button className="champ-back-button" onClick={()=>setSelectedChampionship(null)}><ArrowLeft size={15}/> Voltar para todos os campeonatos</button><Championship drivers={drivers} teams={teams}/></>}
          {section==="Visão geral" && <>
            <div className="stats-grid">
              <Stat icon={<Users/>} label="Pilotos cadastrados" value={String(drivers.length).padStart(2,"0")} foot="Grid da temporada 2026" tone="orange"/>
              <Stat icon={<Shield/>} label="Equipes" value="11" foot="Construtores inscritos" tone="blue"/>
              <Stat icon={<ArrowLeftRight/>} label="Movimentações" value={String(moves.length).padStart(2,"0")} foot="No histórico do sistema" tone="green"/>
              <Stat icon={<Gauge/>} label="Vagas titulares" value={String(Math.max(0,22-drivers.length)).padStart(2,"0")} foot="Limite de 2 por equipe" tone="purple"/>
            </div>
            <div className="dashboard-grid">
              <div className="panel roster-panel"><div className="panel-head"><div><h2>Grid da temporada</h2><p>Composição atual das equipes</p></div><button className="text-button" onClick={()=>setSection("Equipes")}>Ver equipes <ArrowUpRight size={14}/></button></div>
                <div className="team-list">{teams.map(t=>{const ds=drivers.filter(d=>d.teamId===t.id);return <div className="team-row" key={t.id}><div className="team-stripe" style={{background:t.color}}/><div className="team-monogram" style={{color:t.color}}>{t.short}</div><div className="team-info"><b>{t.name}</b><span>{ds.map(d=>d.name).join(" · ")||"Nenhum piloto titular"}</span></div><div className="seat-count">{ds.length}/2 <span>vagas</span></div></div>})}</div>
              </div>
              <div className="panel activity-panel"><div className="panel-head"><div><h2>Mercado recente</h2><p>Últimas movimentações registradas</p></div><Activity size={17} className="muted-icon"/></div>
                <div className="activity-list">{moves.slice(0,5).map(m=><div className="activity-item" key={m.id}><div className="activity-icon"><ArrowLeftRight size={16}/></div><div className="activity-copy"><b>{m.driver}</b><span>{m.from} <ArrowUpRight size={11}/> {m.to}</span><small>{m.date}</small></div><span className="status-tag">{m.status}</span></div>)}</div>
                <button className="wide-ghost" onClick={()=>setSection("Mercado")}>Abrir mercado <ArrowUpRight size={14}/></button>
              </div>
            </div>
          </>}

          {section==="Pilotos" && <div className="panel table-panel"><div className="panel-head"><div><h2>Todos os pilotos</h2><p>{filteredDrivers.length} registros encontrados</p></div><div className="search-box"><Search size={16}/><input placeholder="Buscar piloto ou equipe..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>NACIONALIDADE</th><th>Nº</th><th>EQUIPE</th><th>STATUS</th></tr></thead><tbody>{filteredDrivers.map(d=><tr key={d.id}><td><b>{d.name}</b></td><td>{d.country}</td><td>#{d.number}</td><td><span className="team-cell"><i style={{background:teams.find(t=>t.id===d.teamId)?.color}}/>{teamName(d.teamId)}</span></td><td><span className="status-tag">Titular</span></td></tr>)}</tbody></table></div></div>}

          {section==="Equipes" && <div className="team-cards">{teams.map(t=>{const ds=drivers.filter(d=>d.teamId===t.id);return <div className="panel team-card" key={t.id}><div className="team-card-top"><div className="team-emblem" style={{background:t.color+"18",color:t.color}}>{t.short}</div><span className="seat-count">{ds.length}/2 vagas</span></div><h3>{t.name}</h3><div className="driver-pair">{ds.map(d=><div key={d.id}><span>#{d.number}</span><b>{d.name}</b></div>)}</div><div className="seat-bar"><i style={{width:`${ds.length*50}%`,background:t.color}}/></div></div>})}</div>}

          {section==="Mercado" && <div className="panel table-panel"><div className="panel-head"><div><h2>Central de transferências</h2><p>Movimentações reais de referência e simulações locais</p></div><button className="primary-button compact" onClick={()=>setModal(true)}><Plus size={16}/> Nova transferência</button></div><div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>ORIGEM</th><th>DESTINO</th><th>DATA</th><th>SITUAÇÃO</th></tr></thead><tbody>{moves.map(m=><tr key={m.id}><td><b>{m.driver}</b></td><td>{m.from}</td><td><span className="team-cell"><ArrowUpRight size={14}/>{m.to}</span></td><td>{m.date}</td><td><span className="status-tag">{m.status}</span></td></tr>)}</tbody></table></div><div className="market-note"><Zap size={16}/><span>As transferências criadas nesta demonstração alteram o grid apenas no navegador. A persistência no banco será ligada na próxima etapa.</span></div></div>}
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
