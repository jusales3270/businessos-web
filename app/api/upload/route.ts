import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";

const DOCLING_URL = "http://docling:3002";

export async function POST(req: NextRequest) {
  // Identidade da sessao
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role, department")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "perfil não encontrado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const reqDept = (formData.get("department") as string) || "geral";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Membro só envia para o proprio departamento
  const department = profile.role === "admin" ? reqDept : (profile.department || "geral");

  const uploadDir = path.join(process.cwd(), "uploads", profile.company_id, department);
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
    fd.append("company_id", profile.company_id);

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
