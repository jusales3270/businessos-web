"use client";
import Sidebar from "@/components/Sidebar";

const reports = [
  { title: "Relatório Semanal — Mai 2026", desc: "Análise completa de faturamento, despesas e margem. 5 dias úteis analisados.", date: "29/05/2026", type: "semanal", roi: "R$ 2.400 identificados" },
  { title: "Diagnóstico de Custos", desc: "Identificação de despesas fora do padrão e oportunidades de redução.", date: "28/05/2026", type: "diagnóstico", roi: "R$ 1.800 em risco" },
  { title: "Relatório de Tendências", desc: "Projeção de faturamento para os próximos 30 dias com base no histórico.", date: "27/05/2026", type: "projeção", roi: "R$ 95.000 projetados" },
];

export default function Relatorios() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40 }}>
        <div style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>
            INTELIGÊNCIA OPERACIONAL
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
            Relatórios
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>
            Análises geradas automaticamente pela Sara com base nos seus dados.
          </p>
        </div>

        {/* ROI Banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,255,136,0.04) 100%)",
          border: "1px solid var(--accent)", borderRadius: 8, padding: 28, marginBottom: 40,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>
              ROI ACUMULADO — MAIO 2026
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, color: "var(--green)" }}>
              R$ 4.200
            </div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
              identificados e/ou protegidos pela Sara este mês
            </div>
          </div>
          <button style={{
            padding: "12px 24px", background: "var(--accent)",
            border: "none", borderRadius: 6, color: "var(--bg)",
            fontSize: 12, fontWeight: 700, letterSpacing: 2,
            textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit"
          }}>Exportar PDF</button>
        </div>

        {/* Reports list */}
        <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 16 }}>
          RELATÓRIOS GERADOS ({reports.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map((r, i) => (
            <div key={i} style={{
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: 24,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span className="mono" style={{
                    fontSize: 9, padding: "2px 8px", borderRadius: 3,
                    background: "rgba(0,212,255,0.1)", color: "var(--accent)",
                    textTransform: "uppercase", letterSpacing: 1
                  }}>{r.type}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{r.date}</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>{r.desc}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginBottom: 8 }}>{r.roi}</div>
                <button style={{
                  padding: "8px 16px", background: "transparent",
                  border: "1px solid var(--border-2)", borderRadius: 4,
                  color: "var(--text-2)", fontSize: 11, cursor: "pointer",
                  fontFamily: "inherit"
                }}>Ver relatório</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
