"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

const accepted = [".pdf", ".xlsx", ".xls", ".csv", ".docx", ".txt"];

interface FileInfo { name: string; size: number; date: string; }

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState<FileInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    const res = await fetch("/api/files");
    const data = await res.json();
    setSaved(data.files || []);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleUpload = async () => {
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      await fetch("/api/upload", { method: "POST", body: fd });
    }
    setUploading(false);
    setFiles([]);
    fetchFiles();
  };

  const ext = (name: string) => name.split(".").pop()?.toUpperCase() || "FILE";
  const extColor: Record<string, string> = {
    PDF: "var(--red)", XLSX: "var(--green)", XLS: "var(--green)",
    CSV: "var(--accent)", DOCX: "var(--purple)", TXT: "var(--text-2)"
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 40 }}>
        <div style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 8 }}>
            BASE DE DADOS — SARA
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
            Arquivos do Negócio
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>
            Envie planilhas, relatórios e documentos. A Sara processa e monitora automaticamente.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed var(--border-2)", borderRadius: 12,
            padding: 60, textAlign: "center", cursor: "pointer",
            background: "var(--bg-2)", marginBottom: 32
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Arraste arquivos aqui</div>
          <div style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 16 }}>ou clique para selecionar</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{accepted.join(" · ")}</div>
          <input ref={inputRef} type="file" multiple accept={accepted.join(",")}
            onChange={handleSelect} style={{ display: "none" }} />
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 12 }}>
              FILA DE UPLOAD ({files.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "var(--bg-2)", border: "1px solid var(--border)",
                  borderRadius: 6, padding: "12px 16px"
                }}>
                  <span className="mono" style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                    background: "rgba(0,0,0,0.4)", color: extColor[ext(f.name)] || "var(--text-2)"
                  }}>{ext(f.name)}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
            <button onClick={handleUpload} disabled={uploading} style={{
              padding: "12px 32px", background: uploading ? "var(--bg-3)" : "var(--accent)",
              border: "none", borderRadius: 6, color: uploading ? "var(--text-2)" : "var(--bg)",
              fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
              cursor: "pointer", fontFamily: "inherit"
            }}>{uploading ? "Enviando..." : "Enviar para Sara"}</button>
          </div>
        )}

        {saved.length > 0 && (
          <div>
            <p className="mono" style={{ fontSize: 11, color: "var(--green)", letterSpacing: 2, marginBottom: 12 }}>
              BASE DE CONHECIMENTO DA SARA ({saved.length} arquivos)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {saved.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "var(--bg-2)", border: "1px solid var(--border)",
                  borderLeft: "2px solid var(--green)", borderRadius: 6, padding: "12px 16px"
                }}>
                  <span style={{ color: "var(--green)", fontSize: 14 }}>✓</span>
                  <span className="mono" style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                    background: "rgba(0,0,0,0.4)", color: extColor[ext(f.name)] || "var(--text-2)"
                  }}>{ext(f.name)}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {(f.size / 1024).toFixed(0)} KB · {new Date(f.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
