"use client";
import Sidebar from "@/components/Sidebar";

const metrics = [
  { label: "Faturamento Mês", value: "R$ 76.000", delta: "+12%", up: true },
  { label: "Despesas", value: "R$ 43.000", delta: "+8%", up: false },
  { label: "Lucro Líquido", value: "R$ 33.000", delta: "+18%", up: true },
  { label: "Margem Média", value: "43,4%", delta: "+2.1pp", up: true },
];

const alerts = [
  { type: "warning", title: "Dia 04/05 — Margem caiu para 22,7%", desc: "Despesas não acompanharam a queda de receita. Investigar custos fixos." },
  { type: "danger", title: "Despesas com tendência de alta", desc: "Último dia 25% acima da média dos dois primeiros dias do período." },
  { type: "ok", title: "Faturamento em crescimento", desc: "Último dia registrou R$ 20.000 — maior valor do período analisado." },
];

const typeColor: Record<string, string> = {
  warning: "var(--yellow)",
  danger: "var(--red)",
  ok: "var(--green)"
};

export default function Dashboard() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40, overflow: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>
            VISÃO GERAL — MAIO 2026
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
            Painel Operacional
          </h1>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
          {metrics.map(m => (
            <div key={m.label} style={{
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: 24
            }}>
              <div style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 1,
                textTransform: "uppercase", marginBottom: 12 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
                {m.value}
              </div>
              <div style={{ fontSize: 12, color: m.up ? "var(--green)" : "var(--red)",
                fontWeight: 600 }}>{m.delta} vs período anterior</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 16 }}>
            ALERTAS GERADOS PELA SARA
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                background: "var(--bg-2)", border: "1px solid var(--border)",
                borderLeft: `3px solid ${typeColor[a.type]}`,
                borderRadius: 8, padding: 20, display: "flex", gap: 16, alignItems: "flex-start"
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0,
                  background: typeColor[a.type], boxShadow: `0 0 8px ${typeColor[a.type]}` }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sara status */}
        <div style={{
          background: "var(--bg-2)", border: "1px solid var(--border)",
          borderRadius: 8, padding: 24, display: "flex", alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, background: "var(--green)", borderRadius: "50%",
              boxShadow: "0 0 12px var(--green)" }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Sara está ativa</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-2)" }}>
                Próxima análise em 47 min · 1 planilha monitorada
              </div>
            </div>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
            Último ciclo: agora há pouco
          </div>
        </div>
      </main>
    </div>
  );
}
