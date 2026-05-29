import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

const ALLOWED = [".pdf", ".xlsx", ".xls", ".csv", ".docx", ".txt"];

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
