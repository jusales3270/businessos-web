import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export async function GET() {
  const uploadDir = path.join(process.cwd(), "uploads");
  try {
    const files = await readdir(uploadDir);
    const details = await Promise.all(
      files.map(async (name) => {
        const s = await stat(path.join(uploadDir, name));
        return { name, size: s.size, date: s.mtime };
      })
    );
    return NextResponse.json({ files: details });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
