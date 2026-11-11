"use client";

import { useMemo, useState } from "react";
import { ACTIVE_SEASON } from "@/lib/superLicense";
import { useCloudState } from "@/lib/useCloudState";
import { getDriverDevelopment, type DriverDevelopmentState } from "@/lib/driverDevelopment";
import Championship from "./components/Championship";
import Formula2Championship, { initialF2Drivers, f2Teams, type Driver as F2Driver } from "./components/Formula2Championship";
import Formula3Championship, { initialF3Drivers, f3Teams, type Driver as F3Driver } from "./components/Formula3Championship";
import {
  Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ArrowLeft, Bell, CarFront,
  ChevronDown, CircleDollarSign, Flag, Gauge, LayoutDashboard, Menu,
  Plus, Search, Settings, Shield, Trophy, Users, X, Check, Zap
} from "lucide-react";

type Team = { id: string; name: string; color: string; short: string };
type Driver = { id: string; licenseId?: string; name: string; country: string; number: number; teamId: string; status: "Titular" | "Reserva" | "Transferido" | "Aposentado" };
type Move = { id: number; driver: string; from: string; to: string; date: string; status: string; category?: string };

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
  { id:"f1", name:"FIA Formula One World Championship", category:"Fórmula 1", season:String(ACTIVE_SEASON), organizer:"FIA", description:"Classificação de pilotos e construtores, calendário e resultados da temporada.", status:"Em andamento", rounds:24 },
  { id:"f2", name:"FIA Formula 2 Championship", category:"Fórmula 2", season:String(ACTIVE_SEASON), organizer:"FIA", description:"Classificação de pilotos e equipes, calendário com Sprint e Feature Race e lançamento de resultados.", status:"Em andamento", rounds:14 },
  { id:"f3", name:"FIA Formula 3 Championship", category:"Fórmula 3", season:String(ACTIVE_SEASON), organizer:"FIA", description:"Classificação de pilotos e equipes, calendário com Sprint e Feature Race e lançamento de resultados.", status:"Em andamento", rounds:10 },
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
  const [f2Drivers,setF2Drivers,f2DriversReady,f2DriversError] = useCloudState<F2Driver[]>("workspace:f2:drivers",initialF2Drivers);
  const [f3Drivers,setF3Drivers,f3DriversReady,f3DriversError] = useCloudState<F3Driver[]>("workspace:f3:drivers",initialF3Drivers);
  const [development,setDevelopment,developmentReady,developmentError] = useCloudState<DriverDevelopmentState>("driver-development:state",{});
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [profileDriverId, setProfileDriverId] = useState<string | null>(null);
  const [profileTeamId, setProfileTeamId] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [destinationCategory,setDestinationCategory] = useState<"F1"|"F2"|"F3"|"RETIRE">("F1");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);


  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? "Sem equipe";
  const openDriverProfile = (id: string) => { setProfileTeamId(null); setProfileDriverId(id); };
  const openTeamProfile = (id: string) => { setProfileDriverId(null); setProfileTeamId(id); };
  const profileDriver = drivers.find(d => d.id === profileDriverId);
  const profileTeam = teams.find(t => t.id === profileTeamId);
  const profileTeamDrivers = profileTeam ? drivers.filter(d => d.status!=="Transferido" && d.status!=="Aposentado" && d.teamId === profileTeam.id) : [];
  const baseProfileDetails = profileDriver ? driverDetails[profileDriver.name] : undefined;
  const profileDevelopment = profileDriver ? (development[profileDriver.licenseId ?? profileDriver.id] ?? (baseProfileDetails ? getDriverDevelopment(development,profileDriver.licenseId ?? profileDriver.id,baseProfileDetails,ACTIVE_SEASON) : undefined)) : undefined;
  const profileDetails = profileDevelopment ? { age: profileDevelopment.age, contractUntil: baseProfileDetails?.contractUntil ?? null, attributes: profileDevelopment.attributes } : baseProfileDetails;
  const filteredDrivers = useMemo(() => drivers.filter(d => d.status!=="Transferido" &&
    `${d.name} ${teamName(d.teamId)} ${d.country}`.toLowerCase().includes(search.toLowerCase())
  ), [drivers, search, teams]);

  const allMarketDrivers = [
    ...drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado").map(d=>({ ...d, category:"F1" as const, selectionId:"F1:"+d.id })),
    ...f2Drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado").map(d=>({ ...d, category:"F2" as const, selectionId:"F2:"+d.id })),
    ...f3Drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado").map(d=>({ ...d, category:"F3" as const, selectionId:"F3:"+d.id })),
  ];
  const marketTeamName = (category:"F1"|"F2"|"F3", id:string) =>
    (category==="F1"?teams:category==="F2"?f2Teams:f3Teams).find(t=>t.id===id)?.name ?? "Sem equipe";
  const doTransfer = () => {
    const [sourceCategory,sourceId] = selectedDriver.split(":") as ["F1"|"F2"|"F3",string];
    const driver = allMarketDrivers.find(d=>d.category===sourceCategory && d.id===sourceId);
    if (!driver) return;
    if (destinationCategory==="RETIRE") {
      const from = marketTeamName(sourceCategory,driver.teamId)+" · "+sourceCategory;
      if(sourceCategory==="F1") setDrivers(old=>old.map(d=>d.id===sourceId?{...d,status:"Aposentado"}:d));
      if(sourceCategory==="F2") setF2Drivers(old=>old.map(d=>d.id===sourceId?{...d,status:"Aposentado"}:d));
      if(sourceCategory==="F3") setF3Drivers(old=>old.map(d=>d.id===sourceId?{...d,status:"Aposentado"}:d));
      setMoves(old=>[{id:Date.now(),driver:driver.name,from,to:"Aposentadoria",date:"Temporada "+ACTIVE_SEASON,status:"Concluída",category:sourceCategory+" → Aposentadoria"},...old]);
      setModal(false);setSelectedDriver("");setDestination("");setDestinationCategory("F1");
      setNotice(driver.name+" foi aposentado. Seu histórico foi preservado.");
      setSection("Mercado");
      return;
    }
    const targetTeams = destinationCategory==="F1"?teams:destinationCategory==="F2"?f2Teams:f3Teams;
    const target = targetTeams.find(t=>t.id===destination);
    if (!target) return;
    const order = {F3:3,F2:2,F1:1};
    if (order[destinationCategory] > order[sourceCategory]) { setNotice("Não são permitidos rebaixamentos entre categorias."); return; }
    if (sourceCategory==="F3" && destinationCategory==="F1") { setNotice("A promoção deve seguir a hierarquia: primeiro F3 → F2 e depois F2 → F1."); return; }
    if (sourceCategory===destinationCategory && driver.teamId===target.id) { setNotice("Este piloto já pertence a essa equipe."); return; }
    const occupants = destinationCategory==="F1" ? drivers.filter(d=>d.teamId===target.id && d.status==="Titular") : destinationCategory==="F2" ? f2Drivers.filter(d=>d.teamId===target.id && d.status!=="Transferido" && d.status!=="Aposentado") : f3Drivers.filter(d=>d.teamId===target.id && d.status!=="Transferido" && d.status!=="Aposentado");
    if (occupants.length >= 2) { setNotice(target.name+" já possui dois pilotos. Libere uma vaga antes de concluir."); return; }
    const from = marketTeamName(sourceCategory,driver.teamId)+" · "+sourceCategory;
    const to = target.name+" · "+destinationCategory;

