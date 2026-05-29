"use client";
import Sidebar from "@/components/Sidebar";

const alerts = [
  { id: 1, type: "danger", title: "Despesas com tendência de alta", desc: "Último dia 25% acima da média dos primeiros dois dias.", source: "Planilha Financeira", time: "há 12 min", acked: false },
  { id: 2, type: "warning", title: "Margem caiu para 22,7% no dia 04/05", desc: "Despesas não acompanharam a queda de receita. Investigar custos fixos.", source: "Planilha Financeira", time: "há 1h", acked: false },
  { id: 3, type: "warning", title: "Volume de dados insuficiente para análise estatística", desc: "Apenas 5 dias de dados. Recomendado mínimo de 20 dias úteis.", source: "Planilha Financeira", time: "há 2h", acked: true },
  { id: 4, type: "ok", title: "Faturamento em crescimento", desc: "Último dia registrou R$ 20.000 — maior valor do período analisado.", source: "Planilha Financeira", time: "há 3h", acked: true },
];

const typeColor: Record<string, string> = {
  warning: "var(--yellow)",
  danger: "var(--red)",
  ok: "var(--green)"
};

const typeLabel: Record<string, string> = {
  warning: "ATENÇÃO",
  danger: "CRÍTICO",
  ok: "OK"
};

export default function Alertas() {
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
            Anomalias e insights detectados automaticamente pela Sara.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Críticos", value: "1", color: "var(--red)" },
            { label: "Atenção", value: "2", color: "var(--yellow)" },
            { label: "Resolvidos", value: "1", color: "var(--green)" },
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

        {/* Alert list */}
        <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 16 }}>
          TODOS OS ALERTAS ({alerts.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map(a => (
            <div key={a.id} style={{
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderLeft: `3px solid ${a.acked ? "var(--border-2)" : typeColor[a.type]}`,
              borderRadius: 8, padding: 24,
              opacity: a.acked ? 0.6 : 1
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flex: 1 }}>
                  <span className="mono" style={{
                    fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 3,
                    background: a.acked ? "var(--bg-3)" : `${typeColor[a.type]}22`,
                    color: a.acked ? "var(--text-3)" : typeColor[a.type],
                    whiteSpace: "nowrap", marginTop: 2
                  }}>{typeLabel[a.type]}</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 8 }}>{a.desc}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                      {a.source} · {a.time}
                    </div>
                  </div>
                </div>
                {!a.acked && (
                  <button style={{
                    padding: "6px 14px", background: "transparent",
                    border: "1px solid var(--border-2)", borderRadius: 4,
                    color: "var(--text-2)", fontSize: 11, cursor: "pointer",
                    fontFamily: "inherit", whiteSpace: "nowrap"
                  }}>Marcar visto</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
