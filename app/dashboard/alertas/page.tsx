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
  acked: boolean;
}

const sevColor: Record<string, string> = {
  danger: "var(--red)",
  warning: "var(--yellow)",
  ok: "var(--green)"
};
const sevLabel: Record<string, string> = {
  danger: "CRÍTICO",
  warning: "ATENÇÃO",
  ok: "OK"
};

export default function Alertas() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    const res = await fetch("/api/alerts");
    const data = await res.json();
    setAlerts(data.alerts || []);
    setLoading(false);
  };

  const handleAck = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    fetchAlerts();
  };

  const counts = {
    danger: alerts.filter(a => a.severity === "danger").length,
    warning: alerts.filter(a => a.severity === "warning").length,
    ok: alerts.filter(a => a.severity === "ok").length,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40 }}>
        <div style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>
            MONITORAMENTO — TEMPO REAL
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
            Central de Alertas
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>
            Anomalias detectadas automaticamente pela Sara no monitoramento proativo.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Críticos", value: counts.danger, color: "var(--red)" },
            { label: "Atenção", value: counts.warning, color: "var(--yellow)" },
            { label: "Resolvidos", value: counts.ok, color: "var(--green)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: 24, textAlign: "center"
            }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 16 }}>
          TODOS OS ALERTAS ({alerts.length})
        </p>

        {loading ? (
          <div style={{ color: "var(--text-3)", fontSize: 14, padding: 40, textAlign: "center" }}>
            Carregando...
          </div>
        ) : alerts.length === 0 ? (
          <div style={{
            background: "var(--bg-2)", border: "1px solid var(--border)",
            borderRadius: 8, padding: 48, textAlign: "center"
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Tudo sob controle</div>
            <div style={{ color: "var(--text-2)", fontSize: 13 }}>
              A Sara não detectou nenhuma anomalia. Quando algo exigir atenção, aparecerá aqui.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {alerts.map(a => (
              <div key={a.id} style={{
                background: "var(--bg-2)", border: "1px solid var(--border)",
                borderLeft: `3px solid ${sevColor[a.severity] || "var(--border-2)"}`,
                borderRadius: 8, padding: 24
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flex: 1 }}>
                    <span className="mono" style={{
                      fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 3,
                      background: `${sevColor[a.severity]}22`, color: sevColor[a.severity],
                      whiteSpace: "nowrap", marginTop: 2
                    }}>{sevLabel[a.severity] || "INFO"}</span>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{a.title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 8 }}>{a.description}</div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                        {a.source} · {a.department} · {new Date(a.date).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleAck(a.id)} style={{
                    padding: "6px 14px", background: "transparent",
                    border: "1px solid var(--border-2)", borderRadius: 4,
                    color: "var(--text-2)", fontSize: 11, cursor: "pointer",
                    fontFamily: "inherit", whiteSpace: "nowrap"
                  }}>Marcar visto</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
