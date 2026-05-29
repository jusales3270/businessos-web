import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DOCLING_URL = "http://10.0.1.20:3002";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filepath = path.join(uploadDir, file.name);
  await writeFile(filepath, buffer);

  try {
    const blob = new Blob([buffer]);
    const fd = new FormData();
    fd.append("file", blob, file.name);

    const doclingRes = await fetch(`${DOCLING_URL}/upload`, {
      method: "POST",
      body: fd
    });
    const docling = await doclingRes.json();
    return NextResponse.json({ ok: true, name: file.name, docling });
  } catch (e) {
    return NextResponse.json({ ok: true, name: file.name, docling: { error: String(e) } });
  }
}
