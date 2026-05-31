"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useProfile } from "@/lib/useProfile";
import { createClient } from "@/lib/supabase/client";

export default function Config() {
  const { profile, loading } = useProfile();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40 }}>
        <div style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>
            PAINEL DE CONTROLE
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
            Configurações
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>
            Gerencie sua conta e como a Sara se comunica com você.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>

          {/* Conta */}
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 20 }}>CONTA</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Usuário</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{loading ? "—" : (profile?.nome ?? "—")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Email</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{loading ? "—" : (profile?.email ?? "—")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Empresa</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{loading ? "—" : (profile?.companyName ?? "—")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Papel</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {profile?.role === "admin" ? "Administrador" : (profile?.department ? `Membro — ${profile.department}` : "Membro")}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} disabled={signingOut} style={{
              width: "100%", padding: "12px", background: "transparent",
              border: "1px solid var(--red)", borderRadius: 6, color: "var(--red)",
              fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
              cursor: signingOut ? "default" : "pointer", fontFamily: "inherit"
            }}>{signingOut ? "Saindo..." : "Sair da conta"}</button>
          </div>

          {/* Sara status */}
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 20 }}>STATUS DA SARA</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, background: "var(--green)", borderRadius: "50%", boxShadow: "0 0 8px var(--green)" }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Sara está ativa</span>
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--green)" }}>ONLINE</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>
              Modelo: DeepSeek V4 Flash · Gateway: Telegram · Monitor: diário (seg–sex 8h)
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
