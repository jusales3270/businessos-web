"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  nome: string | null;
  role: string;
  department: string | null;
  email: string | null;
  companyName: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("nome, role, department, companies(nome)")
        .eq("id", user.id)
        .single();

      if (data) {
        const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
        setProfile({
          nome: data.nome,
          role: data.role,
          department: data.department,
          email: user.email ?? null,
          companyName: company?.nome ?? null,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  return { profile, loading };
}
