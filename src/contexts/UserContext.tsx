"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserContextType = {
  roleId: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  roleId: null,
  loading: true,
  refreshProfile: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [roleId, setRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    console.log("🔍 Iniciando fetchProfile...");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("📡 Respuesta de supabase.auth.getUser:", { user, userError });

      if (userError || !user) {
        console.error("🚨 Error al obtener usuario o no autenticado:", userError?.message || "No hay usuario");
        setLoading(false);
        return;
      }

      console.log("👤 Usuario encontrado:", user.id);

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", user.id)
        .single();

      console.log("📊 Respuesta de profiles query:", { data, profileError });

      if (profileError) {
        console.error("🚨 Error obteniendo perfil:", profileError.message);
      } else if (data) {
        console.log("✅ Role ID obtenido:", data.role_id);
        setRoleId(data.role_id);
      } else {
        console.log("⚠️ No se encontró perfil para el usuario");
      }
    } catch (error) {
      console.error("🚨 Error inesperado en fetchProfile:", error);
    } finally {
      console.log("🏁 Finalizando fetchProfile, loading: false");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("🔄 Iniciando useEffect de UserContext");
    fetchProfile().catch((error) => {
      console.error("🚨 Error en useEffect al ejecutar fetchProfile:", error);
    });

    const interval = setInterval(() => {
      if (loading && roleId === null) {
        console.log("🔄 Reintentando fetchProfile...");
        fetchProfile().catch((error) => {
          console.error("🚨 Error en reintento de fetchProfile:", error);
        });
      } else {
        console.log("🛑 Deteniendo reintentos, roleId:", roleId);
        clearInterval(interval);
      }
    }, 2000);

    return () => {
      console.log("🧹 Limpiando intervalo");
      clearInterval(interval);
    };
  }, [fetchProfile, loading, roleId]);

  return (
    <UserContext.Provider value={{ roleId, loading, refreshProfile: fetchProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);