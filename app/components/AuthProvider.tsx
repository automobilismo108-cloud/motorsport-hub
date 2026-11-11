"use client";

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type AuthContextValue = { user: User | null; loading: boolean };
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, loading }}>
      <AuthGate>{children}</AuthGate>
    </AuthContext.Provider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) setError("E-mail ou senha inválidos. Confira os dados e tente novamente.");
    setBusy(false);
  };

  if (!hasSupabaseConfig) {
    return <div style={screenStyle}><div style={cardStyle}><div style={markStyle}>MH</div><h1 style={headingStyle}>Configuração necessária</h1><p style={mutedStyle}>O acesso privado do Motorsport Hub está preparado, mas ainda falta conectar o projeto Supabase. Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas configurações do deploy.</p></div></div>;
  }
  if (loading) return <div style={screenStyle}><p style={mutedStyle}>Carregando Motorsport Hub...</p></div>;
  if (!user) {
    return <div style={screenStyle}>
      <form onSubmit={signIn} style={cardStyle}>
        <div style={markStyle}>MH</div>
        <span style={eyebrowStyle}>WORKSPACE PRIVADO</span>
        <h1 style={headingStyle}>Motorsport Hub</h1>
        <p style={mutedStyle}>Entre com sua conta para acessar os campeonatos e seus dados.</p>
        <label style={labelStyle}>E-MAIL<input style={inputStyle} type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="seu@email.com"/></label>
        <label style={labelStyle}>SENHA<input style={inputStyle} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Sua senha"/></label>
        {error && <p role="alert" style={errorStyle}>{error}</p>}
        <button type="submit" disabled={busy} style={buttonStyle}>{busy ? "Entrando..." : "Entrar no sistema"}</button>
        <small style={mutedStyle}>A criação de contas é restrita ao administrador.</small>
      </form>
    </div>;
  }
  return <>{children}<button type="button" onClick={()=>supabase?.auth.signOut()} style={logoutStyle}>Sair</button></>;
}

const screenStyle: React.CSSProperties = { minHeight:"100vh", display:"grid", placeItems:"center", padding:24, background:"#080d16", color:"#f4f6fb", fontFamily:"Arial, sans-serif" };
const cardStyle: React.CSSProperties = { width:"100%", maxWidth:410, display:"flex", flexDirection:"column", gap:16, padding:32, border:"1px solid #263244", borderRadius:18, background:"#111a28", boxShadow:"0 24px 80px #0008" };
const markStyle: React.CSSProperties = { width:48, height:48, display:"grid", placeItems:"center", borderRadius:13, background:"#ff8700", color:"#111", fontWeight:900, letterSpacing:1 };
const eyebrowStyle: React.CSSProperties = { color:"#ff9b2f", fontSize:10, fontWeight:800, letterSpacing:2 };
const headingStyle: React.CSSProperties = { margin:0, fontSize:27, color:"#fff" };
const mutedStyle: React.CSSProperties = { margin:0, color:"#9eacbf", fontSize:13, lineHeight:1.6 };
const labelStyle: React.CSSProperties = { display:"grid", gap:8, color:"#aebbd0", fontSize:10, fontWeight:800, letterSpacing:1 };
const inputStyle: React.CSSProperties = { width:"100%", boxSizing:"border-box", padding:"13px 14px", border:"1px solid #34445b", borderRadius:9, background:"#0b1320", color:"#fff", fontSize:14, outline:"none" };
const buttonStyle: React.CSSProperties = { padding:14, border:0, borderRadius:9, background:"#ff8700", color:"#10141c", fontWeight:800, cursor:"pointer" };
const errorStyle: React.CSSProperties = { margin:0, color:"#ff8c8c", fontSize:13 };
const logoutStyle: React.CSSProperties = { position:"fixed", zIndex:50, right:18, bottom:18, padding:"9px 14px", border:"1px solid #34445b", borderRadius:9, background:"#111a28", color:"#dce5f2", cursor:"pointer", boxShadow:"0 4px 20px #0005" };
