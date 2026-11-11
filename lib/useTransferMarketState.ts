"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export type TransferDriver = {
  id: string;
  licenseId?: string;
  name: string;
  country: string;
  number: number;
  teamId: string;
  status?: "Titular" | "Reserva" | "Ativo" | "Transferido" | "Aposentado";
};

export type TransferMove = {
  id: string | number;
  driver: string;
  from: string;
  to: string;
  date: string;
  status: string;
  category?: string;
};

export type TransferMarketState = {
  f1: TransferDriver[];
  f2: TransferDriver[];
  f3: TransferDriver[];
  moves: TransferMove[];
};

const MARKET_KEY = "workspace:transfer-market:v2";
const LEGACY_KEYS = ["workspace:drivers", "workspace:f2:drivers", "workspace:f3:drivers", "workspace:moves"];

function safeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value as T[] : fallback;
}

export function useTransferMarketState(initial: TransferMarketState): [
  TransferMarketState,
  Dispatch<SetStateAction<TransferMarketState>>,
  boolean,
  string | null
] {
  const { user } = useAuth();
  const [state, setState] = useState<TransferMarketState>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    if (!user || !supabase) return;

    const load = async () => {
      try {
        const { data: current, error: currentError } = await supabase!
          .from("workspace_data")
          .select("payload")
          .eq("user_id", user.id)
          .eq("data_key", MARKET_KEY)
          .maybeSingle();
        if (currentError) throw currentError;
        if (cancelled) return;

        if (current?.payload && typeof current.payload === "object") {
          const saved = current.payload as Partial<TransferMarketState>;
          setState({
            f1: safeArray(saved.f1, initial.f1),
            f2: safeArray(saved.f2, initial.f2),
            f3: safeArray(saved.f3, initial.f3),
            moves: safeArray(saved.moves, initial.moves),
          });
        } else {
          const { data: legacyRows, error: legacyError } = await supabase!
            .from("workspace_data")
            .select("data_key,payload")
            .eq("user_id", user.id)
            .in("data_key", LEGACY_KEYS);
          if (legacyError) throw legacyError;
          if (cancelled) return;
          const byKey = new Map((legacyRows ?? []).map((row: any) => [row.data_key, row.payload]));
          let local: any = null;
          try {
            const raw = window.localStorage.getItem("motorsport-hub:workspace:v1");
            if (raw) local = JSON.parse(raw);
          } catch { /* local migration is optional */ }

          const migrated: TransferMarketState = {
            f1: safeArray(byKey.get("workspace:drivers") ?? local?.drivers, initial.f1),
            f2: safeArray(byKey.get("workspace:f2:drivers"), initial.f2),
            f3: safeArray(byKey.get("workspace:f3:drivers"), initial.f3),
            moves: safeArray(byKey.get("workspace:moves") ?? local?.moves, initial.moves),
          };
          const { error: saveError } = await supabase!
            .from("workspace_data")
            .upsert({ user_id: user.id, data_key: MARKET_KEY, payload: migrated }, { onConflict: "user_id,data_key" });
          if (saveError) throw saveError;
          if (cancelled) return;
          setState(migrated);
        }
        if (!cancelled) setReady(true);
      } catch (cause) {
        console.error("Falha ao carregar o mercado de pilotos.", cause);
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar o mercado de pilotos.");
          setReady(true);
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!ready || error || !user || !supabase) return;
    let cancelled = false;
    const save = async () => {
      const { error: saveError } = await supabase!
        .from("workspace_data")
        .upsert({ user_id: user.id, data_key: MARKET_KEY, payload: state }, { onConflict: "user_id,data_key" });
      if (saveError && !cancelled) {
        console.error("Falha ao salvar o mercado de pilotos.", saveError);
        setError(saveError.message);
      }
    };
    void save();
    return () => { cancelled = true; };
  }, [state, ready, error, user?.id]);

  return [state, setState, ready, error];
}
