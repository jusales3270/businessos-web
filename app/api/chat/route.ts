import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOCLING_URL = "http://docling:3002";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

const MODEL_SEARCH = "deepseek/deepseek-v4-flash";
const MODEL_COUNT = "google/gemini-3.1-flash-lite";

const AGG_HINTS = [
  "quant", "total", "soma", "quantos", "quantas", "numero de", "número de",
  "media", "média", "maior", "menor", "lista", "liste", "todos", "todas",
  "por marca", "por modelo", "por tipo", "contagem", "conte",
];

function isAggregation(q: string): boolean {
  const low = q.toLowerCase();
  return AGG_HINTS.some((h) => low.includes(h));
}

async function semanticSearch(question: string, department: string | null, companyId: string) {
  const res = await fetch(`${DOCLING_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: question, department: department || null, company_id: companyId, match_count: 12 }),
  });
  const data = await res.json();
  return data.results || [];
}

async function askLLM(model: string, prompt: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.1 }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Erro ao gerar resposta.";
}

// Converte linhas estruturadas (jsonb) em texto tabular compacto, uma linha por registro
function rowsToTable(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0].row_data);
  const head = headers.join(" | ");
  const body = rows
    .map((r) => headers.map((h) => r.row_data[h] ?? "").join(" | "))
    .join("\n");
  return `${head}\n${body}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role, department")
      .eq("id", user.id)
      .single();
    if (!profile) return NextResponse.json({ error: "perfil não encontrado" }, { status: 403 });

    const { question, department: reqDept } = await req.json();
    if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

    const department = profile.role === "admin" ? (reqDept || null) : (profile.department || null);
    const counting = isAggregation(question);

    let context = "";
    let sources: string[] = [];
    let model = MODEL_SEARCH;

    if (counting) {
      model = MODEL_COUNT;
      // Busca linhas estruturadas (sem duplicata) — RLS ja isola por empresa,
      // mas filtramos tambem por company_id e department explicitamente.
      let query = supabase
        .from("sheet_rows")
        .select("source_file, department, row_data, row_index")
        .eq("company_id", profile.company_id)
        .order("source_file", { ascending: true })
        .order("row_index", { ascending: true });
      if (department) query = query.eq("department", department);

      const { data: rows } = await query;
      if (rows && rows.length > 0) {
        // agrupa por arquivo para montar tabelas separadas
        const byFile: Record<string, any[]> = {};
        for (const r of rows) {
          (byFile[r.source_file] = byFile[r.source_file] || []).push(r);
        }
        const blocks: string[] = [];
        for (const [file, frows] of Object.entries(byFile)) {
          blocks.push(`### Planilha: ${file} (${frows.length} linhas)\n${rowsToTable(frows)}`);
          sources.push(`${file} (${frows[0].department})`);
        }
        context = blocks.join("\n\n");
      }
    } else {
      const results = await semanticSearch(question, department, profile.company_id);
      if (results.length > 0) {
        context = results
          .map((r: any, i: number) => `[Trecho ${i + 1} — ${r.source_file} (${r.department})]\n${r.content}`)
          .join("\n\n");
        sources = Array.from(new Set(results.map((r: any) => `${r.source_file} (${r.department})`)));
      }
    }

    if (!context) {
      return NextResponse.json({
        answer: "Não encontrei dados na base da sua empresa para responder. Verifique se o arquivo foi enviado pelo dashboard.",
        sources: [],
      });
    }

    const prompt = counting
      ? `Você é a Sara, analista de dados. Abaixo estão TODAS as linhas das planilhas da empresa, em formato tabular (uma linha = um registro, SEM duplicatas). Responda à pergunta CONTANDO ou somando exatamente as linhas que satisfazem o critério. Cada linha conta UMA vez. Seja exata e mostre o número. Se precisar agrupar (ex: por prefixo de código ou por categoria), faça com precisão.

DADOS:
${context}

PERGUNTA: ${question}

RESPOSTA (com o número exato):`
      : `Você é a Sara, analista de dados do negócio. Responda usando APENAS o conteúdo abaixo. Seja direta e cite a fonte. Se não houver dado suficiente, diga.

CONTEÚDO:
${context}

PERGUNTA: ${question}

RESPOSTA:`;

    const answer = await askLLM(model, prompt);
    return NextResponse.json({ answer, sources: Array.from(new Set(sources)) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
