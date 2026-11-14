"use client";

import { useEffect, useState, useRef, type Dispatch, type SetStateAction } from "react";
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
  isFictional?: boolean;
  category?: "F2" | "F3";
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
  freeAgents: TransferDriver[];
  moves: TransferMove[];
};

const MARKET_KEY = "workspace:transfer-market:v2";
const LEGACY_KEYS = ["workspace:drivers", "workspace:f2:drivers", "workspace:f3:drivers", "workspace:moves"];

function safeArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value as T[] : fallback;
}

function rollbackAutomaticCrisisChanges(state: TransferMarketState): TransferMarketState {
  const releaseMoves = state.moves.filter(move =>
    typeof move.category === "string" && move.category.includes("decisão automática por desempenho")
  );
  const signingMoves = state.moves.filter(move =>
    typeof move.category === "string" && move.category.includes("contratação automática")
  );
  if (!releaseMoves.length || !signingMoves.length) return state;

  const next: TransferMarketState = {
    ...state,
    f1: [...state.f1],
    f2: [...state.f2],
    f3: [...state.f3],
    freeAgents: [...state.freeAgents],
    moves: [...state.moves],
  };
  const categories = [next.f1, next.f2, next.f3];

  for (const signing of signingMoves) {
    const categoryIndex = signing.category?.startsWith("F1") ? 0 : signing.category?.startsWith("F2") ? 1 : 2;
    const roster = categories[categoryIndex];
    const replacementIndex = roster.findIndex(driver =>
      driver.id.startsWith("team-ai-") && driver.name === signing.driver
    );
    if (replacementIndex < 0) continue;

    const replacement = roster[replacementIndex];
    const matchingRelease = releaseMoves.find(move =>
      move.category?.startsWith(categoryIndex === 0 ? "F1" : categoryIndex === 1 ? "F2" : "F3") &&
      move.from === signing.to
    );
    const releasedName = matchingRelease?.driver;
    const releasedIndex = releasedName
      ? roster.findIndex(driver => driver.name === releasedName && driver.teamId === replacement.teamId && driver.status === "Transferido")
      : -1;

    roster.splice(replacementIndex, 1);
    const restoredReplacement: TransferDriver = {
      ...replacement,
      id: "free-restored-" + replacement.id,
      teamId: "",
      status: "Ativo",
    };
    if (!next.freeAgents.some(driver => driver.licenseId === restoredReplacement.licenseId || driver.name === restoredReplacement.name)) {
      next.freeAgents.push(restoredReplacement);
    }

    if (releasedIndex >= 0) {
      const released = roster[releasedIndex];
      roster[releasedIndex] = {
        ...released,
        status: categoryIndex === 0 ? "Titular" : "Ativo",
      };
      next.freeAgents = next.freeAgents.filter(driver => driver.name !== released.name);
    }
  }

  next.moves = next.moves.filter(move =>
    !(typeof move.category === "string" &&
      (move.category.includes("decisão automática por desempenho") || move.category.includes("contratação automática")))
  );
  return next;
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
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

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
          const loaded: TransferMarketState = {
            f1: safeArray(saved.f1, initial.f1),
            f2: safeArray(saved.f2, initial.f2),
            f3: safeArray(saved.f3, initial.f3),
            freeAgents: safeArray(saved.freeAgents, initial.freeAgents),
            moves: safeArray(saved.moves, initial.moves),
          };
          const restored = rollbackAutomaticCrisisChanges(loaded);
          if (restored !== loaded) {
            const { error: restoreError } = await supabase!
              .from("workspace_data")
              .upsert({ user_id: user.id, data_key: MARKET_KEY, payload: restored }, { onConflict: "user_id,data_key" });
            if (restoreError) throw restoreError;
          }
          setState(restored);
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
            freeAgents: initial.freeAgents,
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
    const snapshot = state;
    saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
      const { error: saveError } = await supabase!
        .from("workspace_data")
        .upsert({ user_id: user.id, data_key: MARKET_KEY, payload: snapshot }, { onConflict: "user_id,data_key" });
      if (saveError) {
        console.error("Falha ao salvar o mercado de pilotos.", saveError);
        setError(saveError.message);
      }
    });
  }, [state, ready, error, user?.id]);

  return [state, setState, ready, error];
}
