import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { parseSheet, isSpreadsheet } from "@/lib/parseSheet";

const DOCLING_URL = "http://docling:3002";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role, department")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "perfil não encontrado" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const reqDept = (formData.get("department") as string) || "geral";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const department = profile.role === "admin" ? reqDept : (profile.department || "geral");

  const uploadDir = path.join(process.cwd(), "uploads", profile.company_id, department);
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filepath = path.join(uploadDir, file.name);
  await writeFile(filepath, buffer);

  // --- Se for planilha: extrai linhas estruturadas para sheet_rows ---
  let structuredRows = 0;
  let structuredError: string | null = null;
  if (isSpreadsheet(file.name)) {
    try {
      const rows = parseSheet(buffer, file.name);
      // limpa versoes antigas do mesmo arquivo (mesma empresa/dept)
      await supabase
        .from("sheet_rows")
        .delete()
        .eq("company_id", profile.company_id)
        .eq("source_file", file.name)
        .eq("department", department);

      if (rows.length > 0) {
        const payload = rows.map((r) => ({
          company_id: profile.company_id,
          department,
          source_file: file.name,
          row_index: r.row_index,
          row_data: r.row_data,
        }));
        // insere em lotes de 500
        for (let i = 0; i < payload.length; i += 500) {
          const batch = payload.slice(i, i + 500);
          const { error } = await supabase.from("sheet_rows").insert(batch);
          if (error) { structuredError = error.message; break; }
        }
        structuredRows = rows.length;
      }
    } catch (e) {
      structuredError = String(e);
    }
  }

  // --- RAG via Docling (perguntas qualitativas) ---
  try {
    const blob = new Blob([buffer]);
    const fd = new FormData();
    fd.append("file", blob, file.name);
    fd.append("department", department);
    fd.append("company_id", profile.company_id);

    const doclingRes = await fetch(`${DOCLING_URL}/upload`, { method: "POST", body: fd });
    const docling = await doclingRes.json();
    return NextResponse.json({
      ok: true, name: file.name, department, docling,
      structured: { rows: structuredRows, error: structuredError },
    });
  } catch (e) {
    return NextResponse.json({
      ok: true, name: file.name, department,
      docling: { error: String(e) },
      structured: { rows: structuredRows, error: structuredError },
    });
  }
}
