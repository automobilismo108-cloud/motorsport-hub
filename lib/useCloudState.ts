"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type CloudRow<T> = { payload: T };

export function useCloudState<T>(
  dataKey: string,
  initialValue: T,
  legacyStorageKey?: string,
  selectLegacy?: (legacy: any) => T | undefined,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    if (!user || !supabase) return;

    const load = async () => {
      try {
        const { data, error } = await supabase!
          .from("workspace_data")
          .select("payload")
          .eq("user_id", user.id)
          .eq("data_key", dataKey)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        if (data) {
          setValue((data as CloudRow<T>).payload);
        } else {
          let migrated: T | undefined;
          if (legacyStorageKey && selectLegacy) {
            const raw = window.localStorage.getItem(legacyStorageKey);
            if (raw) {
              try { migrated = selectLegacy(JSON.parse(raw)); }
              catch (parseError) { console.warn("Dados locais antigos não puderam ser importados.", parseError); }
            }
          }
          const firstValue = migrated ?? initialValue;
          setValue(firstValue);
          const { error: saveError } = await supabase!
            .from("workspace_data")
            .upsert({ user_id: user.id, data_key: dataKey, payload: firstValue }, { onConflict: "user_id,data_key" });
          if (saveError) throw saveError;
        }
        if (!cancelled) setReady(true);
      } catch (loadError) {
        console.error("Falha ao carregar os dados da nuvem. Confira a configuração do Supabase e as políticas RLS.", loadError);
        if (!cancelled) setReady(true);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [user?.id, dataKey]);

  useEffect(() => {
    if (!ready || !user || !supabase) return;
    const save = async () => {
      const { error } = await supabase!
        .from("workspace_data")
        .upsert({ user_id: user.id, data_key: dataKey, payload: value }, { onConflict: "user_id,data_key" });
      if (error) console.error("Falha ao salvar dados na nuvem.", error);

    };
    void save();
  }, [value, ready, user?.id, dataKey]);

  return [value, setValue, ready];
}
