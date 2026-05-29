"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

const accepted = [".pdf", ".xlsx", ".xls", ".csv", ".docx", ".txt"];
const departments = [
  { id: "financeiro", label: "Financeiro", color: "var(--green)" },
  { id: "vendas", label: "Vendas", color: "var(--accent)" },
  { id: "compras", label: "Compras", color: "var(--yellow)" },
  { id: "rh", label: "RH", color: "var(--purple)" },
  { id: "estoque", label: "Estoque", color: "var(--red)" },
  { id: "geral", label: "Geral", color: "var(--text-2)" },
];

interface FileInfo { name: string; department: string; size: number; date: string; }

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [department, setDepartment] = useState("financeiro");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState<FileInfo[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
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
      fd.append("department", department);
      await fetch("/api/upload", { method: "POST", body: fd });
    }
    setUploading(false);
    setFiles([]);
    fetchFiles();
  };

  const handleDelete = async (name: string, dept: string) => {
    setDeleting(name);
    await fetch(`/api/files?name=${encodeURIComponent(name)}&department=${dept}`, { method: "DELETE" });
    setDeleting(null);
    fetchFiles();
  };

  const ext = (name: string) => name.split(".").pop()?.toUpperCase() || "FILE";
  const extColor: Record<string, string> = {
    PDF: "var(--red)", XLSX: "var(--green)", XLS: "var(--green)",
    CSV: "var(--accent)", DOCX: "var(--purple)", TXT: "var(--text-2)"
  };
  const deptColor = (id: string) => departments.find(d => d.id === id)?.color || "var(--text-2)";
  const deptLabel = (id: string) => departments.find(d => d.id === id)?.label || id;

  const filtered = filter === "all" ? saved : saved.filter(f => f.department === filter);

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
            Selecione o departamento e envie os arquivos. A Sara organiza e monitora por área.
          </p>
        </div>

        {/* Department selector */}
        <div style={{ marginBottom: 24 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 12 }}>
            DEPARTAMENTO DE DESTINO
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {departments.map(d => (
              <button key={d.id} onClick={() => setDepartment(d.id)} style={{
                padding: "10px 20px",
                background: department === d.id ? `${d.color}22` : "var(--bg-2)",
                border: `1px solid ${department === d.id ? d.color : "var(--border)"}`,
                borderRadius: 6, color: department === d.id ? d.color : "var(--text-2)",
                fontSize: 13, fontWeight: department === d.id ? 700 : 400,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s"
              }}>{d.label}</button>
            ))}
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${deptColor(department)}`, borderRadius: 12,
            padding: 50, textAlign: "center", cursor: "pointer",
            background: "var(--bg-2)", marginBottom: 32, transition: "all 0.2s"
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>⬡</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
            Arraste arquivos de <span style={{ color: deptColor(department) }}>{deptLabel(department)}</span>
          </div>
          <div style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 14 }}>ou clique para selecionar</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{accepted.join(" · ")}</div>
          <input ref={inputRef} type="file" multiple accept={accepted.join(",")}
            onChange={handleSelect} style={{ display: "none" }} />
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-2)", letterSpacing: 2, marginBottom: 12 }}>
              FILA → {deptLabel(department).toUpperCase()} ({files.length})
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
            }}>{uploading ? "Enviando..." : `Enviar para ${deptLabel(department)}`}</button>
          </div>
        )}

        {saved.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p className="mono" style={{ fontSize: 11, color: "var(--green)", letterSpacing: 2 }}>
                BASE DE CONHECIMENTO ({filtered.length})
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setFilter("all")} style={{
                  padding: "4px 12px", fontSize: 11,
                  background: filter === "all" ? "var(--bg-3)" : "transparent",
                  border: "1px solid var(--border)", borderRadius: 4,
                  color: filter === "all" ? "var(--text)" : "var(--text-3)",
                  cursor: "pointer", fontFamily: "inherit"
                }}>Todos</button>
                {departments.map(d => (
                  <button key={d.id} onClick={() => setFilter(d.id)} style={{
                    padding: "4px 12px", fontSize: 11,
                    background: filter === d.id ? `${d.color}22` : "transparent",
                    border: `1px solid ${filter === d.id ? d.color : "var(--border)"}`,
                    borderRadius: 4, color: filter === d.id ? d.color : "var(--text-3)",
                    cursor: "pointer", fontFamily: "inherit"
                  }}>{d.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "var(--bg-2)", border: "1px solid var(--border)",
                  borderLeft: `2px solid ${deptColor(f.department)}`, borderRadius: 6, padding: "12px 16px"
                }}>
                  <span style={{ color: "var(--green)", fontSize: 14 }}>✓</span>
                  <span className="mono" style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                    background: "rgba(0,0,0,0.4)", color: extColor[ext(f.name)] || "var(--text-2)"
                  }}>{ext(f.name)}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
                  <span className="mono" style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 3,
                    background: `${deptColor(f.department)}22`, color: deptColor(f.department)
                  }}>{deptLabel(f.department)}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    onClick={() => handleDelete(f.name, f.department)}
                    disabled={deleting === f.name}
                    style={{
                      padding: "6px 14px", background: "transparent",
                      border: "1px solid var(--red)", borderRadius: 4,
                      color: deleting === f.name ? "var(--text-3)" : "var(--red)",
                      fontSize: 11, cursor: "pointer", fontFamily: "inherit"
                    }}
                  >{deleting === f.name ? "..." : "Remover"}</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
