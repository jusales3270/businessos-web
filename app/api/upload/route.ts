import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DOCLING_URL = "http://docling:3002";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const department = (formData.get("department") as string) || "geral";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const uploadDir = path.join(process.cwd(), "uploads", department);
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filepath = path.join(uploadDir, file.name);
  await writeFile(filepath, buffer);

  try {
    const blob = new Blob([buffer]);
    const fd = new FormData();
    fd.append("file", blob, file.name);
    fd.append("department", department);

    const doclingRes = await fetch(`${DOCLING_URL}/upload`, {
      method: "POST",
      body: fd
    });
    const docling = await doclingRes.json();
    return NextResponse.json({ ok: true, name: file.name, department, docling });
  } catch (e) {
    return NextResponse.json({ ok: true, name: file.name, department, docling: { error: String(e) } });
  }
}
