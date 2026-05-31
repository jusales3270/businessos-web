"use client";
import Sidebar from "@/components/Sidebar";

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
            Análises consolidadas que a Sara gera a partir dos dados do negócio.
          </p>
        </div>

        <div style={{
          background: "var(--bg-2)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 48, textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>▦</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Nenhum relatório gerado ainda
          </div>
          <div style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
            Quando você tiver dados suficientes na base de conhecimento, a Sara passará a
            consolidar relatórios periódicos aqui — resumos financeiros, tendências e o panorama
            do negócio. Por enquanto, use a Consulta de Dados para perguntar diretamente.
          </div>
        </div>
      </main>
    </div>
  );
}
