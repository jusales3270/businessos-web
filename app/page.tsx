"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => router.push("/dashboard"), 800);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)",
      position: "relative", overflow: "hidden"
    }}>
      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "60px 60px", opacity: 0.3
      }} />
      
      {/* Glow */}
      <div style={{
        position: "absolute", width: 600, height: 600,
        background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)"
      }} />

      <div style={{ position: "relative", textAlign: "center", padding: 40 }}>
        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            padding: "8px 16px", border: "1px solid var(--border-2)",
            borderRadius: 4, marginBottom: 32,
            background: "rgba(0,212,255,0.04)"
          }}>
            <div style={{ width: 8, height: 8, background: "var(--green)", borderRadius: "50%",
              boxShadow: "0 0 8px var(--green)" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2 }}>
              SISTEMA OPERACIONAL
            </span>
          </div>

          <h1 style={{
            fontSize: 72, fontWeight: 800, letterSpacing: -2,
            background: "linear-gradient(135deg, #E8EDF4 0%, #7A8899 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1, marginBottom: 8
          }}>
            BusinessOS
          </h1>
          <p style={{ color: "var(--accent)", fontSize: 13, letterSpacing: 4,
            fontWeight: 600, textTransform: "uppercase" }}>
            S.A.R.A — Supervisora Autônoma de Resultados e Alertas
          </p>
        </div>

        {/* Login box */}
        <div style={{
          background: "var(--bg-2)", border: "1px solid var(--border)",
          borderRadius: 8, padding: 40, width: 380, margin: "0 auto"
        }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-2)",
              letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
              Empresa
            </label>
            <input
              type="text"
              placeholder="seu@email.com.br"
              style={{
                width: "100%", padding: "12px 16px",
                background: "var(--bg-3)", border: "1px solid var(--border)",
                borderRadius: 4, color: "var(--text)", fontSize: 14,
                outline: "none", fontFamily: "inherit"
              }}
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-2)",
              letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: "100%", padding: "12px 16px",
                background: "var(--bg-3)", border: "1px solid var(--border)",
                borderRadius: 4, color: "var(--text)", fontSize: 14,
                outline: "none", fontFamily: "inherit"
              }}
            />
          </div>
          <button
            onClick={handleLogin}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "var(--bg-3)" : "var(--accent)",
              border: "none", borderRadius: 4, color: loading ? "var(--text-2)" : "var(--bg)",
              fontSize: 13, fontWeight: 700, letterSpacing: 2,
              textTransform: "uppercase", cursor: "pointer",
              transition: "all 0.2s", fontFamily: "inherit"
            }}
          >
            {loading ? "Conectando..." : "Acessar Sistema"}
          </button>
        </div>

        <p className="mono" style={{ marginTop: 32, fontSize: 11, color: "var(--text-3)" }}>
          BusinessOS v1.0 — Antigravity © 2026
        </p>
      </div>
    </div>
  );
}
