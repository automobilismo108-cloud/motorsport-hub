"use client";

import { useState } from "react";
import { useCloudState } from "@/lib/useCloudState";
import { Newspaper, Plus, X, Trash2, Flag } from "lucide-react";

type Article = { id:string; title:string; category:"Confirmada"|"Rumor"|"Análise"; tag:string; body:string; createdAt:string; season:number };

export default function PaddockNews(){
  const [articles,setArticles,ready,error]=useCloudState<Article[]>("paddock-news:f1",[]);
  const [composer,setComposer]=useState(false);
  const [title,setTitle]=useState("");
  const [category,setCategory]=useState<Article["category"]>("Análise");
  const [tag,setTag]=useState("Paddock");
  const [body,setBody]=useState("");
  const [filter,setFilter]=useState("Todas");
  const publish=()=>{
    if(!title.trim()||!body.trim())return;
    const article:Article={id:globalThis.crypto?.randomUUID?.()??String(Date.now()),title:title.trim(),category,tag:tag.trim()||"Paddock",body:body.trim(),createdAt:new Date().toISOString(),season:2026};
    setArticles(old=>[article,...old]);
    setTitle("");setBody("");setComposer(false);
  };
  const visible=articles.filter(a=>filter==="Todas"||a.category===filter);
  if(error)return <div className="notice">Não foi possível sincronizar o Paddock News.</div>;
  return <div className="paddock-page">
    <div className="paddock-masthead panel">
      <div className="paddock-kicker"><Flag size={14}/> MOTORSPORT HUB · REDAÇÃO F1</div>
      <div className="paddock-brand"><Newspaper size={34}/><div><h2>PADDOCK NEWS</h2><p>A temporada por trás das corridas.</p></div></div>
      <div className="paddock-edition">EDIÇÃO {new Date().toLocaleDateString("pt-BR")} · TEMPORADA 2026</div>
    </div>
    <div className="paddock-toolbar">
      <div><span className="eyebrow">JORNAL DA FÓRMULA 1</span><h2>Últimas notícias</h2><p>Notícias e histórias do universo da F1.</p></div>
      <button className="primary-button" onClick={()=>setComposer(v=>!v)}>{composer?<X size={16}/>:<Plus size={16}/>} {composer?"Fechar":"Nova matéria"}</button>
    </div>
    {composer&&<div className="panel paddock-composer">
      <h3>Publicar matéria</h3>
      <label>MANCHETE<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Escreva o título da notícia"/></label>
      <div className="paddock-form-row"><label>TIPO<select value={category} onChange={e=>setCategory(e.target.value as Article["category"])}><option>Confirmada</option><option>Rumor</option><option>Análise</option></select></label><label>EDITORIA<input value={tag} onChange={e=>setTag(e.target.value)} placeholder="Ex.: Mercado"/></label></div>
      <label>TEXTO DA MATÉRIA<textarea rows={5} value={body} onChange={e=>setBody(e.target.value)} placeholder="Conte o que aconteceu ou apresente a especulação. Rumores devem ser tratados como não confirmados."/></label>
      <div className="paddock-form-actions"><button className="secondary-button" onClick={()=>setComposer(false)}>Cancelar</button><button className="primary-button" disabled={!title.trim()||!body.trim()||!ready} onClick={publish}>Publicar notícia</button></div>
    </div>}
    <div className="paddock-filters">{["Todas","Confirmada","Rumor","Análise"].map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}</button>)}</div>
    {!ready?<div className="panel paddock-empty">Carregando notícias...</div>:visible.length===0?<div className="panel paddock-empty"><Newspaper size={30}/><h3>Nenhuma notícia publicada</h3><p>As matérias da F1 aparecerão aqui. Use “Nova matéria” para registrar uma notícia ou rumor do seu universo.</p></div>:<div className="paddock-articles">{visible.map(a=><article className="panel paddock-article" key={a.id}><div className="paddock-article-meta"><span className={"paddock-type "+a.category.toLowerCase()}>{a.category}</span><span>{a.tag}</span><time>{new Date(a.createdAt).toLocaleString("pt-BR")}</time><button title="Excluir matéria" onClick={()=>setArticles(old=>old.filter(x=>x.id!==a.id))}><Trash2 size={15}/></button></div><h3>{a.title}</h3><p>{a.body}</p><small>PADDOCK NEWS · F1 {a.season}</small></article>)}</div>}
    <div className="paddock-disclaimer">As matérias são editoriais do seu universo de jogo. Rumores não representam transferências confirmadas.</div>
  </div>;
}
