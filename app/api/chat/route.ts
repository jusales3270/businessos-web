import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOCLING_URL = "http://docling:3002";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

// Palavras que indicam pergunta de contagem/agregacao.
const AGG_HINTS = [
  "quant", "total", "soma", "quantos", "quantas", "numero de", "número de",
  "media", "média", "maior", "menor", "lista", "liste", "todos", "todas",
  "por marca", "por modelo", "por tipo", "contagem", "conte",
];

function isAggregation(q: string): boolean {
  const low = q.toLowerCase();
  return AGG_HINTS.some((h) => low.includes(h));
}

async function search(question: string, department: string | null, companyId: string, matchCount: number) {
  const searchRes = await fetch(`${DOCLING_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: question,
      department: department || null,
      company_id: companyId,
      match_count: matchCount,
    }),
  });
  const searchData = await searchRes.json();
  return searchData.results || [];
}

export async function POST(req: NextRequest) {
  try {
    // --- Identidade vem da SESSAO, nunca do cliente ---
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

    const { question, department: reqDept } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }

    // Membro só enxerga o proprio departamento; admin pode filtrar livremente
    const department = profile.role === "admin"
      ? (reqDept || null)
      : (profile.department || null);

    // Contagem traz mais trechos; busca normal traz 12
    const matchCount = isAggregation(question) ? 40 : 12;
    const results = await search(question, department, profile.company_id, matchCount);

    if (!results || results.length === 0) {
      return NextResponse.json({
        answer: "Não encontrei documentos na base de conhecimento da sua empresa para responder. Verifique se o arquivo foi enviado pelo dashboard.",
        sources: [],
      });
    }

    const context = results
      .map((r: any, i: number) => `[Trecho ${i + 1} — ${r.source_file} (${r.department})]\n${r.content}`)
      .join("\n\n");
    const sources = Array.from(new Set(results.map((r: any) => `${r.source_file} (${r.department})`)));

    const prompt = `Você é a Sara, analista de dados do negócio. Responda à pergunta usando APENAS o conteúdo abaixo, extraído dos documentos reais da empresa. Seja direta e cite números concretos. Quando a pergunta for de contagem, CONTE cuidadosamente os itens listados. Se o conteúdo não permitir responder, diga que não há dado suficiente. Não invente.

CONTEÚDO DA BASE DE CONHECIMENTO:
${context}

PERGUNTA: ${question}

RESPOSTA:`;

    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });
    const llmData = await llmRes.json();
    const answer = llmData.choices?.[0]?.message?.content || "Erro ao gerar resposta.";

    return NextResponse.json({ answer, sources });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
