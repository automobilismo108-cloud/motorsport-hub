"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ACTIVE_SEASON } from "@/lib/superLicense";
import { useCloudState } from "@/lib/useCloudState";
import { useTransferMarketState, type TransferDriver } from "@/lib/useTransferMarketState";
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
type Driver = { id: string; licenseId?: string; name: string; country: string; number: number; teamId: string; status: "Titular" | "Reserva" | "Transferido" | "Aposentado"; isFictional?: boolean };
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


const ACADEMY_FIRST_NAMES = ["Lucas","Enzo","Theo","Matteo","Leon","Nicolas","Adrian","Felix","Marco","Daniel","Gabriel","Rafael","Ethan","Oliver","Hugo","Alex","Milan","Arthur","Noah","Luca","Samuel","Diego","Tom","Julian","Mika","Kai","Andre","Bruno","Victor","Sebastian"];
const ACADEMY_LAST_NAMES = ["Moretti","Silva","Laurent","Weber","Kowalski","Tanaka","Andersen","Costa","Martin","Rossi","Müller","Dubois","Sato","Bianchi","Novak","Ferreira","Schneider","Lindström","Pereira","Ricci","Santos","Nakamura","Petrov","Berg","Almeida","Conti","Yamamoto","Fischer","Mendes","Johansson"];
const ACADEMY_COUNTRIES = ["Brasil","Itália","França","Alemanha","Polônia","Japão","Dinamarca","Portugal","Reino Unido","Espanha","Suécia","Argentina","Países Baixos","Finlândia","México","Austrália"];
function createAcademyFill(category:"F2"|"F3",teamId:string,resultingRoster:TransferDriver[],allDrivers:TransferDriver[]) {
  const activeInTeam=resultingRoster.filter(d=>d.teamId===teamId&&d.status!=="Transferido"&&d.status!=="Aposentado").length;
  if(activeInTeam>0) return {drivers:[] as TransferDriver[],development:{} as DriverDevelopmentState};
  const usedNames=new Set(allDrivers.map(d=>d.name));
  const usedNumbers=new Set(allDrivers.filter(d=>d.number>=1&&d.number<=99).map(d=>d.number));
  const created:TransferDriver[]=[];
  const records:DriverDevelopmentState={};
  let candidate=0;
  while(created.length<2&&candidate<ACADEMY_FIRST_NAMES.length*ACADEMY_LAST_NAMES.length){
    const first=ACADEMY_FIRST_NAMES[candidate%ACADEMY_FIRST_NAMES.length];
    const last=ACADEMY_LAST_NAMES[Math.floor(candidate/ACADEMY_FIRST_NAMES.length)];
    candidate++;
    const name=first+" "+last;
    if(usedNames.has(name)) continue;
    const slug=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const licenseId="academy:"+category.toLowerCase()+":"+slug;
    const number=Array.from({length:99},(_,i)=>i+1).find(n=>!usedNumbers.has(n));
    if(number===undefined) break;
    const index=created.length;
    const base=category==="F2"?70:58;
    const attributes={racePace:base+((candidate*3+index)%8),qualifying:base+((candidate*5+index)%8),overtaking:base+((candidate*7+index)%8),defending:base+((candidate*2+index)%8),consistency:base+((candidate*4+index)%8)};
    const age=category==="F2"?19+(candidate%5):16+(candidate%4);
    const potential=Math.min(90,Math.max(category==="F2"?68:62,base+12+((candidate*3)%13)));
    const id="academy-"+category.toLowerCase()+"-"+teamId+"-"+slug;
    created.push({id,licenseId,name,country:ACADEMY_COUNTRIES[(candidate*3+index)%ACADEMY_COUNTRIES.length],number,teamId,status:"Ativo",isFictional:true});
    usedNames.add(name);usedNumbers.add(number);
    records[licenseId]={age, potential, attributes, history:[]};
  }
  return {drivers:created,development:records};
}


function buildInitialFreeAgents() {
  const roster = [
    ["Mateo Alvarez","Argentina",81,20],["Enzo Moretti","Itália",82,19],
    ["Lucas Ferreira","Brasil",83,21],["Theo Laurent","França",84,20],
    ["Oliver Hughes","Reino Unido",85,22],["Mika Korhonen","Finlândia",86,19],
    ["Kenji Sato","Japão",87,20],["Nikolai Petrov","Bulgária",88,21],
    ["Leon Weber","Alemanha",89,22],["Rafael Costa","Portugal",90,19],
    ["Gabriel Silva","Brasil",91,17],["Luca Bianchi","Itália",92,18],
    ["Adam Novak","República Tcheca",93,17],["Hugo Martin","Espanha",94,18],
    ["Felix Andersen","Dinamarca",95,16],["Daniel Kim","Coreia do Sul",96,17],
    ["Arthur Dubois","França",97,18],["Diego Ramos","México",98,17],
    ["Milan Jansen","Países Baixos",99,16],["Noah Campbell","Austrália",80,18]
  ] as const;
  const drivers: TransferDriver[] = [];
  const development: DriverDevelopmentState = {};
  roster.forEach(([name,country,number,age],index)=>{
    const licenseId="free-agent:"+name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
    const base=62+(index%9);
    const attributes={racePace:base+(index%5),qualifying:base+((index+2)%5),overtaking:base+((index+3)%5),defending:base+((index+1)%5),consistency:base+((index+4)%5)};
    drivers.push({id:"free-"+(index+1),licenseId,name,country,number,teamId:"",status:"Ativo",isFictional:true});
    development[licenseId]={age,potential:Math.min(91,base+17+(index%8)),attributes,history:[]};
  });
  return {drivers,development};
}
const INITIAL_FREE_AGENT_POOL=buildInitialFreeAgents();

export default function Home() {
  const [section, setSection] = useState("Visão geral");
  const [selectedChampionship, setSelectedChampionship] = useState<string | null>(null);
  const [teams] = useState(initialTeams);
  const [marketState,setMarketState,marketReady,marketError] = useTransferMarketState({
    f1: initialDriversSeed, f2: initialF2Drivers, f3: initialF3Drivers, freeAgents: INITIAL_FREE_AGENT_POOL.drivers, moves: initialMoves
  });
  const drivers = marketState.f1 as Driver[];
  const f2Drivers = marketState.f2 as F2Driver[];
  const f3Drivers = marketState.f3 as F3Driver[];
  const moves = marketState.moves as Move[];
  const freeAgents = marketState.freeAgents ?? INITIAL_FREE_AGENT_POOL.drivers;
  const [marketTab,setMarketTab] = useState<"movements"|"free">("movements");
  const setF2Drivers: Dispatch<SetStateAction<F2Driver[]>> = action => setMarketState(old => ({
    ...old, f2: typeof action === "function" ? (action as (value:F2Driver[])=>F2Driver[])(old.f2 as F2Driver[]) : action as TransferDriver[]
  }));
  const setF3Drivers: Dispatch<SetStateAction<F3Driver[]>> = action => setMarketState(old => ({
    ...old, f3: typeof action === "function" ? (action as (value:F3Driver[])=>F3Driver[])(old.f3 as F3Driver[]) : action as TransferDriver[]
  }));
  const [development,setDevelopment,developmentReady,developmentError] = useCloudState<DriverDevelopmentState>("driver-development:state",INITIAL_FREE_AGENT_POOL.development);
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
  const filteredDrivers = useMemo(() => drivers.filter(d => d.status!=="Transferido" && d.status!=="Aposentado" &&
    `${d.name} ${teamName(d.teamId)} ${d.country}`.toLowerCase().includes(search.toLowerCase())
  ), [drivers, search, teams]);

  const allMarketDrivers = [
    ...drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado").map(d=>({ ...d, category:"F1" as const, selectionId:"F1|"+d.id })),
    ...f2Drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado").map(d=>({ ...d, category:"F2" as const, selectionId:"F2|"+d.id })),
    ...f3Drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado").map(d=>({ ...d, category:"F3" as const, selectionId:"F3|"+d.id })),
    ...freeAgents.map(d=>({ ...d, category:"LIVRE" as const, selectionId:"LIVRE|"+d.id })),
  ];
  const marketTeamName = (category:"F1"|"F2"|"F3", id:string) =>
    (category==="F1"?teams:category==="F2"?f2Teams:f3Teams).find(t=>t.id===id)?.name ?? "Sem equipe";
  const doTransfer = () => {
    const separator = selectedDriver.indexOf("|");
    if (separator < 0) { setNotice("Selecione um piloto válido."); return; }
    const selectedCategory = selectedDriver.slice(0,separator);
    const isFreeAgent = selectedCategory==="LIVRE";
    const sourceId = selectedDriver.slice(separator+1);
    const freeDriver = isFreeAgent ? freeAgents.find(d=>d.id===sourceId) : undefined;
    const sourceCategory = (isFreeAgent ? undefined : selectedCategory) as "F1"|"F2"|"F3"|undefined;
    if (!isFreeAgent && !sourceCategory) { setNotice("Selecione um piloto válido."); return; }
    const sourceList = sourceCategory==="F1" ? marketState.f1 : sourceCategory==="F2" ? marketState.f2 : marketState.f3;
    const driver = isFreeAgent ? freeDriver : sourceList.find(d=>d.id===sourceId && d.status!=="Transferido" && d.status!=="Aposentado");
    if (!driver) { setNotice("Este piloto não está mais disponível no elenco. Atualize a página e tente novamente."); return; }

    const from = isFreeAgent ? "Agente livre" : marketTeamName(sourceCategory!,driver.teamId)+" · "+sourceCategory;
    const move = {
      id: Date.now(), driver: driver.name, from,
      to: destinationCategory==="RETIRE" ? "Aposentadoria" : "",
      date: "Temporada "+ACTIVE_SEASON, status: "Concluída",
      category: (isFreeAgent ? "Livre" : sourceCategory)+" → "+destinationCategory
    };

    if (destinationCategory==="RETIRE") {
      if (isFreeAgent) { setNotice("Pilotos livres não podem ser aposentados antes de assinarem com uma equipe."); return; }
      const key = sourceCategory==="F1" ? "f1" : sourceCategory==="F2" ? "f2" : "f3";
      const sourceAfter = marketState[key].map(d=>d.id===sourceId ? {...d,status:"Aposentado" as const} : d);
      const academy = sourceCategory==="F2" || sourceCategory==="F3"
        ? createAcademyFill(sourceCategory,driver.teamId,sourceAfter,[...marketState.f1,...marketState.f2,...marketState.f3])
        : {drivers:[] as TransferDriver[],development:{} as DriverDevelopmentState};
      setMarketState(old=>({...old,[key]:[...sourceAfter,...academy.drivers],moves:[move,...old.moves]}));
      if(Object.keys(academy.development).length) setDevelopment(old=>({...old,...academy.development}));
      setModal(false);setSelectedDriver("");setDestination("");setDestinationCategory("F1");
      setNotice(driver.name+" foi aposentado. O registro e os resultados anteriores foram preservados.");
      return;
    }

    const targetTeams = destinationCategory==="F1"?teams:destinationCategory==="F2"?f2Teams:f3Teams;
    const target = targetTeams.find(t=>t.id===destination);
    if (!target) { setNotice("Selecione uma equipe de destino."); return; }

    const hierarchy = {F1:3,F2:2,F3:1};
    if (!isFreeAgent && hierarchy[destinationCategory] < hierarchy[sourceCategory!]) {
      setNotice("Rebaixamentos não são permitidos. A hierarquia é F3 → F2 → F1."); return;
    }
    if (!isFreeAgent && sourceCategory==="F3" && destinationCategory==="F1") {
      setNotice("A promoção precisa passar pela Fórmula 2: F3 → F2 → F1."); return;
    }
    const identity = driver.licenseId ?? "driver:"+driver.id;
    const duplicateActive = [...marketState.f1,...marketState.f2,...marketState.f3].some(d =>
      d.licenseId===identity && d.id!==sourceId && d.status!=="Transferido" && d.status!=="Aposentado"
    );
    if (duplicateActive) {
      setNotice("Este piloto já aparece em outro elenco ativo. A movimentação foi bloqueada para evitar duplicidade."); return;
    }
    if (!isFreeAgent && sourceCategory===destinationCategory && driver.teamId===target.id) {
      setNotice("Este piloto já pertence a essa equipe."); return;
    }

    const destinationRoster = destinationCategory==="F1" ? marketState.f1 : destinationCategory==="F2" ? marketState.f2 : marketState.f3;
    const occupied = destinationRoster.filter(d =>
      d.teamId===target.id && d.status!=="Transferido" && d.status!=="Aposentado" &&
      !(!isFreeAgent && sourceCategory===destinationCategory && d.id===sourceId)
    ).length;
    if (occupied>=2) { setNotice(target.name+" já tem dois pilotos ativos. Escolha outra equipe ou libere uma vaga."); return; }

    move.to = target.name+" · "+destinationCategory;
    const keyFor = (category:"F1"|"F2"|"F3") => category==="F1" ? "f1" : category==="F2" ? "f2" : "f3";
    if (isFreeAgent) {
      const targetKey=keyFor(destinationCategory);
      const identity=driver.licenseId ?? "driver:"+driver.id;
      const {category:_unassignedCategory,...unassignedDriver}=driver;
      const signed:TransferDriver={...unassignedDriver,id:"signed-"+Date.now()+"-"+sourceId,licenseId:identity,teamId:target.id,status:destinationCategory==="F1"?"Titular":"Ativo"};
      setMarketState(old=>({...old,freeAgents:old.freeAgents.filter(d=>d.id!==sourceId),[targetKey]:[...old[targetKey],signed],moves:[move,...old.moves]}));
      const savedDevelopment=INITIAL_FREE_AGENT_POOL.development[identity];
      if(savedDevelopment) setDevelopment(old=>({...old,[identity]:old[identity]??savedDevelopment}));
      setModal(false);setSelectedDriver("");setDestination("");setDestinationCategory("F1");
      setNotice(driver.name+" assinou com "+target.name+" · "+destinationCategory+".");
      return;
    }
    const sourceKey = keyFor(sourceCategory);
    const targetKey = keyFor(destinationCategory);
    if (sourceCategory===destinationCategory) {
      const sourceAfter=marketState[sourceKey].map(d=>d.id===sourceId ? {...d,teamId:target.id} : d);
      const academy=(sourceCategory==="F2"||sourceCategory==="F3")
        ? createAcademyFill(sourceCategory,driver.teamId,sourceAfter,[...marketState.f1,...marketState.f2,...marketState.f3])
        : {drivers:[] as TransferDriver[],development:{} as DriverDevelopmentState};
      setMarketState(old=>({...old,[sourceKey]:[...sourceAfter,...academy.drivers],moves:[move,...old.moves]}));
      if(Object.keys(academy.development).length) setDevelopment(current=>({...current,...academy.development}));
    } else {
      const archived = marketState[sourceKey].map(d=>d.id===sourceId ? {...d,status:"Transferido" as const} : d);
      const academy=(sourceCategory==="F2"||sourceCategory==="F3")
        ? createAcademyFill(sourceCategory,driver.teamId,archived,[...marketState.f1,...marketState.f2,...marketState.f3])
        : {drivers:[] as TransferDriver[],development:{} as DriverDevelopmentState};
      const targetId = "move-"+Date.now()+"-"+(driver.licenseId ?? driver.id).replace(/[^a-zA-Z0-9_-]/g,"");
      const promoted: TransferDriver = {
        ...driver, id: targetId, licenseId: driver.licenseId ?? "driver:"+driver.id,
        teamId: target.id, status: destinationCategory==="F1" ? "Titular" : "Ativo"
      };
      setMarketState(old=>({...old,[sourceKey]:[...archived,...academy.drivers],[targetKey]:[...old[targetKey],promoted],moves:[move,...old.moves]}));
      if(Object.keys(academy.development).length) setDevelopment(current=>({...current,...academy.development}));
    }
    setModal(false);setSelectedDriver("");setDestination("");setDestinationCategory("F1");
    setNotice("Movimentação concluída: "+driver.name+" · "+sourceCategory+" → "+destinationCategory+".");
  };

  const nav = [
    {label:"Visão geral",icon:LayoutDashboard},
    {label:"Pilotos",icon:Users},
    {label:"Equipes",icon:Shield},
    {label:"Mercado",icon:ArrowLeftRight},
  ];

  if (marketError || developmentError) return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#080d16",color:"#dce5f2"}}>{marketError || developmentError}</div>;
  if (!marketReady || !developmentReady) return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#080d16",color:"#dce5f2"}}>Sincronizando seus dados com segurança...</div>;

  return (
    <main className="shell">
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Flag size={21}/></div><div><b>MOTORSPORT</b><span>HUB <i>2026</i></span></div><button className="close-menu" onClick={()=>setMobileMenu(false)}><X/></button></div>
        <div className="workspace"><span className="live-dot"/> TEMPORADA ATIVA <b>{ACTIVE_SEASON}</b></div>
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
          {((section==="Campeonatos" && selectedChampionship==="f1") || section==="Configurações") && <>{section==="Campeonatos" && <button className="champ-back-button" onClick={()=>setSelectedChampionship(null)}><ArrowLeft size={15}/> Voltar para todos os campeonatos</button>}<Championship drivers={drivers} teams={teams} driverDetails={driverDetails} development={development} setDevelopment={setDevelopment} settingsOnly={section==="Configurações"}/></>}
          {section==="Campeonatos" && selectedChampionship==="f2" && <><button className="champ-back-button" onClick={()=>setSelectedChampionship(null)}><ArrowLeft size={15}/> Voltar para todos os campeonatos</button><Formula2Championship development={development} setDevelopment={setDevelopment} drivers={f2Drivers} setDrivers={setF2Drivers}/></>}
          {section==="Campeonatos" && selectedChampionship==="f3" && <><button className="champ-back-button" onClick={()=>setSelectedChampionship(null)}><ArrowLeft size={15}/> Voltar para todos os campeonatos</button><Formula3Championship development={development} setDevelopment={setDevelopment} drivers={f3Drivers} setDrivers={setF3Drivers}/></>}
          {profileDriver && <div className="driver-profile-page">
            <button className="champ-back-button" onClick={()=>setProfileDriverId(null)}><ArrowLeft size={15}/> Voltar</button>
            <div className="panel driver-profile-hero">
              <div className="driver-profile-number">#{profileDriver.number}</div>
              <div className="driver-profile-heading"><span className="eyebrow">FICHA DO PILOTO</span><h2>{profileDriver.name}</h2><p>{profileDriver.country} · {teamName(profileDriver.teamId)} · {profileDriver.status}</p></div>
              <span className="status-tag">TEMPORADA {ACTIVE_SEASON}</span>
            </div>
            <div className="driver-facts-grid">
              <div className="panel driver-fact"><span>IDADE</span><b>{profileDetails?.age ?? "—"} anos</b></div>
              <div className="panel driver-fact"><span>NACIONALIDADE</span><b>{profileDriver.country}</b></div>
              <div className="panel driver-fact"><span>CONTRATO ATUAL</span><b>{profileDetails?.contractUntil ? `Até o fim de ${profileDetails.contractUntil}` : "Não divulgado"}</b></div>
              <div className="panel driver-fact"><span>SUPERLICENÇA</span><b>COMPLETO</b></div>
            </div>
            <div className="panel driver-attributes-panel">
              <div className="panel-head"><div><h2>Desenvolvimento do piloto</h2><p>Evolução automática ao final de cada temporada</p></div><span className="status-tag">POTENCIAL {profileDevelopment?.potential ?? "—"}/100</span></div>
              <div className="driver-facts-grid">
                <div className="panel driver-fact"><span>POTENCIAL</span><b>{profileDevelopment?.potential ?? "—"} / 100</b></div>
                <div className="panel driver-fact"><span>EVOLUÇÃO RECENTE</span><b>{(profileDevelopment?.history.at(-1)?.change ?? 0) > 0 ? "+" : ""}{profileDevelopment?.history.at(-1)?.change ?? 0}</b></div>
                <div className="panel driver-fact"><span>TEMPORADAS REGISTRADAS</span><b>{profileDevelopment?.history.length ?? 0}</b></div>
              </div>
              <div className="driver-attributes-list">{profileDevelopment?.history.slice().reverse().map((item,index)=><div className="driver-attribute-row" key={`${item.category}-${item.season}-${index}`}><div><b>{item.season} · {item.category}</b><strong>{item.change>0?"+":""}{item.change}</strong></div><small>Posição final: {item.position}º · Média {item.overallBefore} → {item.overallAfter}</small></div>)}</div>
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
              <div className="driver-profile-heading"><span className="eyebrow">FICHA DA EQUIPE</span><h2>{profileTeam.name}</h2><p>Fórmula 1 · Temporada {ACTIVE_SEASON}</p></div>
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
              <Stat icon={<Users/>} label="Pilotos cadastrados" value={String(drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado").length).padStart(2,"0")} foot="Grid da temporada 2026" tone="orange"/>
              <Stat icon={<Shield/>} label="Equipes" value="11" foot="Construtores inscritos" tone="blue"/>
              <Stat icon={<ArrowLeftRight/>} label="Movimentações" value={String(moves.length).padStart(2,"0")} foot="No histórico do sistema" tone="green"/>
              <Stat icon={<Gauge/>} label="Vagas titulares" value={String(Math.max(0,22-drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado").length)).padStart(2,"0")} foot="Limite de 2 por equipe" tone="purple"/>
            </div>
            <div className="dashboard-grid">
              <div className="panel roster-panel"><div className="panel-head"><div><h2>Grid da temporada</h2><p>Composição atual das equipes</p></div><button className="text-button" onClick={()=>setSection("Equipes")}>Ver equipes <ArrowUpRight size={14}/></button></div>
                <div className="team-list">{teams.map(t=>{const ds=drivers.filter(d=>d.status!=="Transferido" && d.status!=="Aposentado" && d.teamId===t.id);return <div className="team-row" key={t.id}><div className="team-stripe" style={{background:t.color}}/><div className="team-monogram" style={{color:t.color}}>{t.short}</div><div className="team-info"><button type="button" className="driver-name-link team-name-link" onClick={()=>openTeamProfile(t.id)}>{t.name}</button><span>{ds.map(d=>d.name).join(" · ")||"Nenhum piloto titular"}</span></div><div className="seat-count">{ds.length}/2 <span>vagas</span></div></div>})}</div>
              </div>
              <div className="panel activity-panel"><div className="panel-head"><div><h2>Mercado recente</h2><p>Últimas movimentações registradas</p></div><Activity size={17} className="muted-icon"/></div>
                <div className="activity-list">{moves.slice(0,5).map(m=><div className="activity-item" key={m.id}><div className="activity-icon"><ArrowLeftRight size={16}/></div><div className="activity-copy"><button type="button" className="driver-name-link" onClick={()=>{const d=drivers.find(x=>x.name===m.driver);if(d)openDriverProfile(d.id)}}>{m.driver}</button><span>{m.from} <ArrowUpRight size={11}/> {m.to}</span><small>{m.date}</small></div><span className="status-tag">{m.status}</span></div>)}</div>
                <button className="wide-ghost" onClick={()=>setSection("Mercado")}>Abrir mercado <ArrowUpRight size={14}/></button>
              </div>
            </div>
          </>}

          {!profileDriver && !profileTeam && section==="Pilotos" && <div className="panel table-panel"><div className="panel-head"><div><h2>Todos os pilotos</h2><p>{filteredDrivers.length} registros encontrados</p></div><div className="search-box"><Search size={16}/><input placeholder="Buscar piloto ou equipe..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>NACIONALIDADE</th><th>Nº</th><th>EQUIPE</th><th>STATUS</th></tr></thead><tbody>{filteredDrivers.map(d=><tr key={d.id}><td><button type="button" className="driver-name-link" onClick={()=>openDriverProfile(d.id)}>{d.name}</button></td><td>{d.country}</td><td>#{d.number}</td><td><span className="team-cell"><i style={{background:teams.find(t=>t.id===d.teamId)?.color}}/><button type="button" className="driver-name-link team-name-link" onClick={()=>openTeamProfile(d.teamId)}>{teamName(d.teamId)}</button></span></td><td><span className="status-tag">Titular</span></td></tr>)}</tbody></table></div></div>}

          {!profileDriver && !profileTeam && section==="Equipes" && <div className="team-cards">{teams.map(t=>{const ds=drivers.filter(d=>d.teamId===t.id && d.status!=="Transferido" && d.status!=="Aposentado");return <div className="panel team-card" key={t.id}><div className="team-card-top"><div className="team-emblem" style={{background:t.color+"18",color:t.color}}>{t.short}</div><span className="seat-count">{ds.length}/2 vagas</span></div><h3><button type="button" className="driver-name-link team-name-link" onClick={()=>openTeamProfile(t.id)}>{t.name}</button></h3><div className="driver-pair">{ds.map(d=><div key={d.id}><span>#{d.number}</span><button type="button" className="driver-name-link" onClick={()=>openDriverProfile(d.id)}>{d.name}</button></div>)}</div><div className="seat-bar"><i style={{width:`${ds.length*50}%`,background:t.color}}/></div></div>})}</div>}

          {!profileDriver && !profileTeam && section==="Mercado" && <>
            <div className="champ-tabs market-tabs">
              <button className={marketTab==="movements"?"selected":""} onClick={()=>setMarketTab("movements")}><ArrowLeftRight size={14}/> Movimentações</button>
              <button className={marketTab==="free"?"selected":""} onClick={()=>setMarketTab("free")}><Users size={14}/> Pilotos livres <span className="nav-count">{freeAgents.length}</span></button>
            </div>
            {marketTab==="movements" && <div className="panel table-panel"><div className="panel-head"><div><h2>Central de transferências</h2><p>Transferências entre equipes, promoções e aposentadorias</p></div><button className="primary-button compact" onClick={()=>setModal(true)}><Plus size={16}/> Nova transferência</button></div><div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>ORIGEM</th><th>DESTINO</th><th>DATA</th><th>SITUAÇÃO</th></tr></thead><tbody>{moves.map(m=><tr key={m.id}><td><b>{m.driver}</b></td><td>{m.from}</td><td><span className="team-cell"><ArrowUpRight size={14}/>{m.to}</span></td><td>{m.date}</td><td><span className="status-tag">{m.status}</span></td></tr>)}</tbody></table></div><div className="market-note"><Zap size={16}/><span>Transferências entre equipes e promoções F3 → F2 → F1 são salvas na nuvem. Rebaixamentos não são permitidos; a Superlicença não bloqueia movimentações nesta etapa.</span></div></div>}
            {marketTab==="free" && <div className="panel table-panel"><div className="panel-head"><div><h2>Pilotos livres</h2><p>{freeAgents.length} pilotos sem contrato disponíveis para contratação</p></div><span className="status-tag">20 fictícios iniciais</span></div><div className="table-wrap"><table><thead><tr><th>PILOTO</th><th>NACIONALIDADE</th><th>CATEGORIA</th><th>IDADE</th><th>POTENCIAL</th><th>STATUS</th><th></th></tr></thead><tbody>{freeAgents.map(d=>{const details=development[d.licenseId??d.id]??INITIAL_FREE_AGENT_POOL.development[d.licenseId??d.id];return <tr key={d.id}><td><b>{d.name}</b><div className="free-agent-origin">Piloto fictício · Academia</div></td><td>{d.country}</td><td>Livre</td><td>{details?.age??"—"}</td><td>{details?.potential??"—"}</td><td><span className="status-tag">Sem contrato</span></td><td><button className="primary-button compact" onClick={()=>{setSelectedDriver("LIVRE|"+d.id);setDestinationCategory("F1");setDestination("");setNotice("");setModal(true)}}><Plus size={14}/> Contratar</button></td></tr>})}</tbody></table></div><div className="market-note"><Zap size={16}/><span>Os pilotos livres não ocupam vagas em equipes. Ao contratar, o piloto sai desta lista e passa a integrar o elenco escolhido. A lista é salva na nuvem.</span></div></div>}
          </>}
          <footer> MOTORSPORT HUB <span>•</span> DADOS DE REFERÊNCIA: TEMPORADA 2026 <span>•</span> PROTÓTIPO 0.1</footer>
        </div>
      </section>

      {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="modal"><div className="modal-head"><div><span className="eyebrow">MERCADO DE PILOTOS</span><h2>Nova movimentação</h2><p>Transfira entre equipes, promova de categoria ou registre uma aposentadoria.</p></div><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div><label>PILOTO<select value={selectedDriver} onChange={e=>setSelectedDriver(e.target.value)}><option value="">Selecione um piloto</option>{allMarketDrivers.map(d=><option key={d.selectionId} value={d.selectionId}>{d.name} · {d.selectionId.startsWith("LIVRE|") ? "LIVRE" : d.category} · {d.selectionId.startsWith("LIVRE|") ? "Sem contrato" : marketTeamName(d.category,d.teamId)}</option>)}</select></label><div className="transfer-arrow"><ArrowDownLeft size={18}/> DESTINO</div><label>TIPO DE MOVIMENTAÇÃO<select value={destinationCategory} onChange={e=>{setDestinationCategory(e.target.value as "F1"|"F2"|"F3"|"RETIRE");setDestination("");}}><option value="F1">Fórmula 1</option><option value="F2">Fórmula 2</option><option value="F3">Fórmula 3</option><option value="RETIRE">Aposentar piloto</option></select></label>{destinationCategory!=="RETIRE"&&<label>NOVA EQUIPE<select value={destination} onChange={e=>setDestination(e.target.value)}><option value="">Selecione a equipe de destino</option>{(destinationCategory==="F1"?teams:destinationCategory==="F2"?f2Teams:f3Teams).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}<div className="modal-hint">Limite de dois pilotos por equipe. Promoções permitidas: F3 → F2 e F2 → F1. Rebaixamentos não são permitidos. A Superlicença não é exigida. Aposentadorias preservam o histórico do piloto.</div><div className="modal-actions"><button className="secondary-button" onClick={()=>setModal(false)}>Cancelar</button><button className="primary-button" disabled={!selectedDriver||(destinationCategory!=="RETIRE"&&!destination)} onClick={doTransfer}><Check size={16}/> Confirmar movimentação</button></div></div></div>}
    </main>
  );
}

function Stat({icon,label,value,foot,tone}:{icon:React.ReactNode,label:string,value:string,foot:string,tone:string}) {
  return <div className="panel stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong>{value}</strong><small>{foot}</small></div>;
}
