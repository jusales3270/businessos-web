import { NextRequest, NextResponse } from "next/server";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";

const ALLOWED = [".pdf", ".xlsx", ".xls", ".csv", ".docx", ".txt"];
const DOCLING_URL = "http://docling:3002";
const DEPARTMENTS = ["financeiro", "vendas", "compras", "rh", "estoque", "geral"];

export async function GET() {
  const baseDir = path.join(process.cwd(), "uploads");
  const allFiles: any[] = [];

  for (const dept of DEPARTMENTS) {
    const deptDir = path.join(baseDir, dept);
    try {
      const files = await readdir(deptDir);
      const filtered = files.filter(f => ALLOWED.some(ext => f.toLowerCase().endsWith(ext)));
      for (const name of filtered) {
        const s = await stat(path.join(deptDir, name));
        allFiles.push({ name, department: dept, size: s.size, date: s.mtime });
      }
    } catch {}
  }

  return NextResponse.json({ files: allFiles });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("name");
  const department = searchParams.get("department") || "geral";
  if (!filename) return NextResponse.json({ error: "No name" }, { status: 400 });

  const filepath = path.join(process.cwd(), "uploads", department, filename);

  try {
    await unlink(filepath);
    await fetch(`${DOCLING_URL}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, department })
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
