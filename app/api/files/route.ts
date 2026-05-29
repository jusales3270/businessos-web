import { NextRequest, NextResponse } from "next/server";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";

const ALLOWED = [".pdf", ".xlsx", ".xls", ".csv", ".docx", ".txt"];
const DOCLING_URL = "http://10.0.1.20:3002";

export async function GET() {
  const uploadDir = path.join(process.cwd(), "uploads");
  try {
    const files = await readdir(uploadDir);
    const filtered = files.filter(f => ALLOWED.some(ext => f.toLowerCase().endsWith(ext)));
    const details = await Promise.all(
      filtered.map(async (name) => {
        const s = await stat(path.join(uploadDir, name));
        return { name, size: s.size, date: s.mtime };
      })
    );
    return NextResponse.json({ files: details });
  } catch {
    return NextResponse.json({ files: [] });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("name");
  if (!filename) return NextResponse.json({ error: "No name" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "uploads");
  const filepath = path.join(uploadDir, filename);

  try {
    await unlink(filepath);
    await fetch(`${DOCLING_URL}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename })
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
