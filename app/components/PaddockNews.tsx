"use client";

import { useEffect, useMemo } from "react";
import { useCloudState } from "@/lib/useCloudState";
import { ACTIVE_SEASON } from "@/lib/superLicense";
import { Newspaper, Flag } from "lucide-react";

type Driver = { id:string; name:string; teamId:string; status:string };
type Move = { id:number; driver:string; from:string; to:string; date:string; status:string; category?:string };
type Race = { id:number; round:number; name:string; circuit:string; date:string; status:string };
type Result = { id:number; raceId:number; driverId:string; position:number|null; points:number; status:string };
type Agreement = {id:string;driverName:string;sourceCategory:string;sourceTeam:string;targetCategory:string;targetTeam:string;type:"Pré-contrato"|"Renovação";signedSeason:number;effectiveSeason:number;duration:number;status:string};
type Article = { id:string; eventKey:string; title:string; category:"Confirmada"|"Rumor"|"Análise"; tag:string; body:string; createdAt:string; season:number };

const teamNames:Record<string,string>={mcl:"McLaren",mer:"Mercedes",red:"Red Bull Racing",fer:"Ferrari",wil:"Williams",rb:"Racing Bulls",ast:"Aston Martin",has:"Haas",aud:"Audi",alp:"Alpine",cad:"Cadillac"};

export default function PaddockNews({drivers,moves}:{drivers:Driver[];moves:Move[]}){
  const [articles,setArticles,ready,error]=useCloudState<Article[]>("paddock-news:f1",[]);
  const [races,,racesReady,racesError]=useCloudState<Race[]>(`championship:f1:${ACTIVE_SEASON}:races`,[]);
  const [results,,resultsReady,resultsError]=useCloudState<Result[]>(`championship:f1:${ACTIVE_SEASON}:results`,[]);\n  const [agreements,,agreementsReady,agreementsError]=useCloudState<Agreement[]>("workspace:driver-contracts:v1",[]);
  const driverById=useMemo(()=>new Map(drivers.map(d=>[d.id,d])),[drivers]);
  useEffect(()=>{
    if(!ready||!racesReady||!resultsReady||!agreementsReady||error||racesError||resultsError||agreementsError)return;
    const generated:Article[]=[];
    const now=new Date().toISOString();
    for(const race of races.filter(r=>r.status==="Concluída")){
      const rows=results.filter(r=>r.raceId===race.id);
      if(!rows.length)continue;
      const ordered=rows.filter(r=>r.position!==null).sort((a,b)=>(a.position??99)-(b.position??99));
      const podium=ordered.slice(0,3).map((r,i)=>`${i+1}º ${driverById.get(r.driverId)?.name??"Piloto"}`).join(" · ");
      const winner=ordered[0];
      const winnerName=winner?driverById.get(winner.driverId)?.name:"";
      generated.push({id:`f1-race-${race.id}`,eventKey:`f1-race-${race.id}`,title:winnerName?`${winnerName} vence ${race.name}`:`${race.name}: classificação definida`,category:"Confirmada",tag:"Grande Prêmio",body:`A etapa em ${race.circuit} foi registrada no campeonato. ${podium? "Destaques da chegada: "+podium+". ":""}Foram lançados ${rows.length} resultados no sistema. A classificação e a pontuação refletem os dados registrados para esta corrida.`,createdAt:now,season:ACTIVE_SEASON});
      const sorted=drivers.filter(d=>d.status!=="Transferido"&&d.status!=="Aposentado").map(d=>({driver:d,points:results.filter(r=>r.driverId===d.id).reduce((sum,r)=>sum+r.points,0)})).sort((a,b)=>a.points-b.points);
      const subject=sorted[0]?.driver;
      if(subject)generated.push({id:`f1-rumor-${race.id}`,eventKey:`f1-rumor-${race.id}`,title:`Rumores no paddock: futuro de ${subject.name} entra em debate`,category:"Rumor",tag:"Bastidores",body:`Após ${race.name}, começam especulações sobre os próximos passos de ${subject.name}. O desempenho recente alimenta conversas sobre pressão e expectativas dentro do paddock, mas não existe confirmação de negociação ou mudança de equipe. Este é um conteúdo editorial fictício e não altera contratos, elencos ou transferências do campeonato.`,createdAt:now,season:ACTIVE_SEASON});
    }
    for(const agreement of agreements.filter(a=>a.status==="Assinado"&&a.signedSeason===ACTIVE_SEASON&&a.targetCategory==="F1")){\n      const key="f1-contract-"+agreement.id;\n      generated.push({id:key,eventKey:key,title:agreement.type==="Renovação"?agreement.driverName+" renova contrato com "+agreement.targetTeam:agreement.targetTeam+" garante pré-contrato de "+agreement.driverName,category:"Confirmada",tag:"Mercado de pilotos",body:agreement.type==="Renovação"?agreement.driverName+" assinou uma renovação com "+agreement.targetTeam+" por "+agreement.duration+" temporada(s). O vínculo passa a valer conforme o acordo registrado.":agreement.targetTeam+" confirmou um pré-contrato com "+agreement.driverName,+" para a temporada "+agreement.effectiveSeason+". O piloto permanece na equipe atual até o fim da temporada "+ACTIVE_SEASON+".",createdAt:now,season:ACTIVE_SEASON});\n    }\n    for(const move of moves){
      const related=move.category?.includes("F1")||move.from.toLowerCase().includes("f1")||move.to.toLowerCase().includes("f1")||Object.values(teamNames).some(name=>move.from===name||move.to===name)||move.to==="Aposentadoria"&&drivers.some(d=>d.name===move.driver);
      if(!related||move.status!=="Concluída")continue;
      const key=`f1-move-${move.id}`;
      generated.push({id:key,eventKey:key,title:move.to==="Aposentadoria"?`${move.driver} anuncia aposentadoria`:`${move.driver} muda de equipe na Fórmula 1`,category:"Confirmada",tag:"Mercado",body:move.to==="Aposentadoria"?`${move.driver} encerra sua trajetória como piloto ativo. A movimentação foi registrada no mercado do Motorsport Hub.`:`${move.driver} deixa ${move.from} e passa a defender ${move.to}. A movimentação foi registrada no mercado do Motorsport Hub e passa a integrar o histórico da categoria.`,createdAt:now,season:ACTIVE_SEASON});
    }
    if(generated.length)setArticles(old=>{const keys=new Set(old.map(a=>a.eventKey));const fresh=generated.filter(a=>!keys.has(a.eventKey));return fresh.length?[...fresh,...old]:old;});
  },[ready,racesReady,resultsReady,agreementsReady,error,racesError,resultsError,agreementsError,races,results,drivers,moves,agreements,driverById,setArticles]);
  if(error||racesError||resultsError||agreementsError)return <div className="notice">Não foi possível sincronizar o Paddock News. Os dados do campeonato não foram alterados.</div>;
  return <div className="paddock-page">
    <div className="paddock-masthead panel"><div className="paddock-kicker"><Flag size={14}/> MOTORSPORT HUB · REDAÇÃO F1</div><div className="paddock-brand"><Newspaper size={34}/><div><h2>PADDOCK NEWS</h2><p>A temporada por trás das corridas.</p></div></div><div className="paddock-edition">EDIÇÃO AUTOMÁTICA · TEMPORADA {ACTIVE_SEASON}</div></div>
    <div className="paddock-toolbar"><div><span className="eyebrow">JORNAL DA FÓRMULA 1</span><h2>Últimas notícias</h2><p>Matérias geradas automaticamente a partir dos resultados e movimentações da F1.</p></div></div>
    {!ready||!racesReady||!resultsReady||!agreementsReady?<div className="panel paddock-empty">Sincronizando o jornal com o campeonato...</div>:articles.length===0?<div className="panel paddock-empty"><Newspaper size={30}/><h3>Aguardando os acontecimentos da pista</h3><p>As primeiras matérias serão publicadas automaticamente quando houver resultados de corridas ou movimentações relacionadas à Fórmula 1.</p></div>:<div className="paddock-articles">{articles.map(a=><article className="panel paddock-article" key={a.eventKey}><div className="paddock-article-meta"><span className={"paddock-type "+a.category.toLowerCase()}>{a.category}</span><span>{a.tag}</span><time>{new Date(a.createdAt).toLocaleString("pt-BR")}</time></div><h3>{a.title}</h3><p>{a.body}</p><small>PADDOCK NEWS · F1 {a.season}</small></article>)}</div>}
    <div className="paddock-disclaimer">Rumores são narrativas editoriais fictícias, sempre identificadas como não confirmadas. Nenhuma notícia altera resultados, contratos ou elencos.</div>
  </div>;
}
