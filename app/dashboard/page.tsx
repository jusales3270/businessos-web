"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

interface Alert {
  id: string;
  severity: string;
  title: string;
  description: string;
  source: string;
  department: string;
  date: string;
}

const sevColor: Record<string, string> = {
  danger: "var(--red)",
  warning: "var(--yellow)",
  ok: "var(--green)",
};

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/alerts").then((r) => r.json()).catch(() => ({ alerts: [] })),
      fetch("/api/files").then((r) => r.json()).catch(() => ({ files: [] })),
    ]).then(([a, f]) => {
      setAlerts(a.alerts || []);
      setFiles(f.files || []);
      setLoading(false);
    });
  }, []);

  const counts = {
    danger: alerts.filter((a) => a.severity === "danger").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
  };
  const recentAlerts = alerts.slice(0, 4);

  const depts = Array.from(new Set(files.map((f) => f.department)));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40, overflow: "auto" }}>
        <div style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>
            VISÃO GERAL
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
            Painel Operacional
          </h1>
        </div>

        {/* Resumo real */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Documentos na base", value: loading ? "—" : String(files.length), color: "var(--accent)" },
            { label: "Departamentos ativos", value: loading ? "—" : String(depts.length), color: "var(--accent)" },
            { label: "Alertas críticos", value: loading ? "—" : String(counts.danger), color: "var(--red)" },
            { label: "Alertas de atenção", value: loading ? "—" : String(counts.warning), color: "var(--yellow)" },
          ].map((m) => (
            <div key={m.label} style={{
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: 24,
            }}>
              <div style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Alertas reais */}
        <div style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 16 }}>
            ALERTAS RECENTES DA SARA
          </p>
          {loading ? (
            <div style={{ color: "var(--text-3)", fontSize: 14, padding: 24 }}>Carregando...</div>
          ) : recentAlerts.length === 0 ? (
            <div style={{
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: 32, textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhum alerta no momento</div>
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>
                A Sara avisa aqui quando o monitoramento detectar algo que exige atenção.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentAlerts.map((a) => (
                <div key={a.id} style={{
                  background: "var(--bg-2)", border: "1px solid var(--border)",
                  borderLeft: `3px solid ${sevColor[a.severity] || "var(--border-2)"}`,
                  borderRadius: 8, padding: 20, display: "flex", gap: 16, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0,
                    background: sevColor[a.severity], boxShadow: `0 0 8px ${sevColor[a.severity]}`,
                  }} />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{a.description}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>
                      {a.source} · {a.department}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sara status */}
        <div style={{
          background: "var(--bg-2)", border: "1px solid var(--border)",
          borderRadius: 8, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, background: "var(--green)", borderRadius: "50%", boxShadow: "0 0 12px var(--green)" }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Sara está ativa</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-2)" }}>
                Monitor diário · {loading ? "—" : files.length} documento(s) na base
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
