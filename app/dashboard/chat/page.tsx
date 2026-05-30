"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

interface Msg { role: "user" | "assistant"; content: string; sources?: string[]; }

const departments = [
  { id: "", label: "Todos" },
  { id: "financeiro", label: "Financeiro" },
  { id: "vendas", label: "Vendas" },
  { id: "compras", label: "Compras" },
  { id: "rh", label: "RH" },
  { id: "estoque", label: "Estoque" },
  { id: "geral", label: "Geral" },
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, department: department || null }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.answer || data.error || "Erro.",
        sources: data.sources || [],
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Erro de conexão." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40, display: "flex", flexDirection: "column", maxHeight: "100vh" }}>
        <div style={{ marginBottom: 24 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>
            PERGUNTE À SARA
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
            Consulta de Dados
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>
            Pergunte sobre qualquer dado do negócio. A Sara busca direto na base de conhecimento.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {departments.map(d => (
            <button key={d.id} onClick={() => setDepartment(d.id)} style={{
              padding: "5px 14px", fontSize: 12,
              background: department === d.id ? "var(--accent)" : "var(--bg-2)",
              border: `1px solid ${department === d.id ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 4, color: department === d.id ? "var(--bg)" : "var(--text-2)",
              cursor: "pointer", fontFamily: "inherit", fontWeight: department === d.id ? 700 : 400,
            }}>{d.label}</button>
          ))}
        </div>

        <div style={{
          flex: 1, overflowY: "auto", background: "var(--bg-2)",
          border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 16,
          display: "flex", flexDirection: "column", gap: 16
        }}>
          {messages.length === 0 && (
            <div style={{ color: "var(--text-3)", fontSize: 14, textAlign: "center", margin: "auto" }}>
              Faça uma pergunta sobre os dados do seu negócio.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
            }}>
              <div style={{
                background: m.role === "user" ? "var(--accent)" : "var(--bg-3)",
                color: m.role === "user" ? "var(--bg)" : "var(--text)",
                padding: "12px 16px", borderRadius: 10, fontSize: 14, lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}>{m.content}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>
                  Fontes: {m.sources.join(" · ")}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", color: "var(--text-3)", fontSize: 13 }}>
              Sara está consultando a base...
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
            placeholder="Pergunte algo sobre o negócio..."
            style={{
              flex: 1, padding: "14px 18px", background: "var(--bg-3)",
              border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)",
              fontSize: 14, outline: "none", fontFamily: "inherit",
            }}
          />
          <button onClick={send} disabled={loading} style={{
            padding: "14px 28px", background: loading ? "var(--bg-3)" : "var(--accent)",
            border: "none", borderRadius: 8, color: loading ? "var(--text-2)" : "var(--bg)",
            fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
            cursor: loading ? "default" : "pointer", fontFamily: "inherit",
          }}>Enviar</button>
        </div>
      </main>
    </div>
  );
}
