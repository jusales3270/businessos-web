"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/lib/useProfile";

const items = [
  { label: "Visão Geral", path: "/dashboard", icon: "◈" },
  { label: "Consulta de Dados", path: "/dashboard/chat", icon: "✦" },
  { label: "Arquivos", path: "/dashboard/upload", icon: "⬡" },
  { label: "Alertas", path: "/dashboard/alertas", icon: "◉" },
  { label: "Relatórios", path: "/dashboard/relatorios", icon: "▦" },
  { label: "Configurações", path: "/dashboard/config", icon: "⊞" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, loading } = useProfile();

  return (
    <div style={{
      width: 240, minHeight: "100vh", background: "var(--bg-2)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", padding: "24px 0", flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 6, height: 6, background: "var(--green)", borderRadius: "50%",
            boxShadow: "0 0 8px var(--green)" }} />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>BusinessOS</span>
        </div>
        <span className="mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: 2 }}>
          SARA ATIVA
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {items.map(item => {
          const active = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 24px", cursor: "pointer",
                background: active ? "rgba(0,212,255,0.06)" : "transparent",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                color: active ? "var(--text)" : "var(--text-2)",
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.15s"
              }}>
                <span style={{ color: active ? "var(--accent)" : "var(--text-3)", fontSize: 16 }}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom — empresa e usuario reais */}
      <div style={{ padding: "24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Empresa</div>
        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginBottom: 12 }}>
          {loading ? "—" : (profile?.companyName ?? "—")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "var(--bg-3)",
            border: "1px solid var(--border-2)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--accent)"
          }}>
            {(profile?.nome ?? "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {loading ? "—" : (profile?.nome ?? "Usuário")}
            </div>
            <div className="mono" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase" }}>
              {profile?.role === "admin" ? "Administrador" : profile?.department || "Membro"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
