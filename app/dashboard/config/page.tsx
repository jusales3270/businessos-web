"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function Config() {
  const [telegram, setTelegram] = useState("@sara_businessos_bot");
  const [interval, setInterval] = useState("60");
  const [email, setEmail] = useState("");

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
            Gerencie como a Sara monitora e se comunica com você.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>

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
              Modelo: DeepSeek V4 Flash · Gateway: Telegram · Voz: Francisca Neural
            </div>
          </div>

          {/* Notificações */}
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 20 }}>NOTIFICAÇÕES</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-2)", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                Telegram
              </label>
              <input value={telegram} onChange={e => setTelegram(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: "var(--bg-3)",
                  border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)",
                  fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-2)", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                E-mail para relatórios semanais
              </label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com.br"
                style={{ width: "100%", padding: "10px 14px", background: "var(--bg-3)",
                  border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)",
                  fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>

          {/* Monitor */}
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 20 }}>MONITOR PROATIVO</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-2)", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                Intervalo de análise (minutos)
              </label>
              <select value={interval} onChange={e => setInterval(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: "var(--bg-3)",
                  border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)",
                  fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="120">2 horas</option>
                <option value="360">6 horas</option>
                <option value="1440">Diário</option>
              </select>
            </div>
          </div>

          {/* Fontes */}
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 20 }}>FONTES DE DADOS</p>
            {[
              { name: "Google Sheets", status: true, detail: "1 planilha conectada" },
              { name: "Arquivos (PDF/Excel)", status: false, detail: "Nenhum arquivo enviado" },
              { name: "Omie ERP", status: false, detail: "Não configurado" },
              { name: "Bling", status: false, detail: "Não configurado" },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none"
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{s.detail}</div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: s.status ? "var(--green)" : "var(--border-2)",
                  boxShadow: s.status ? "0 0 8px var(--green)" : "none"
                }} />
              </div>
            ))}
          </div>

          <button style={{
            padding: "14px", background: "var(--accent)",
            border: "none", borderRadius: 6, color: "var(--bg)",
            fontSize: 13, fontWeight: 700, letterSpacing: 2,
            textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit"
          }}>Salvar Configurações</button>
        </div>
      </main>
    </div>
  );
}
