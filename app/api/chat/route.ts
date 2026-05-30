import { NextRequest, NextResponse } from "next/server";

const DOCLING_URL = "http://docling:3002";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

// Palavras que indicam pergunta de contagem/agregacao — nesses casos
// busca semantica nao basta, precisamos do documento inteiro.
const AGG_HINTS = [
  "quant", "total", "soma", "quantos", "quantas", "numero de", "número de",
  "media", "média", "maior", "menor", "lista", "liste", "todos", "todas",
  "por marca", "por modelo", "por tipo", "contagem", "conte",
];

function isAggregation(q: string): boolean {
  const low = q.toLowerCase();
  return AGG_HINTS.some((h) => low.includes(h));
}

async function getContext(question: string, department: string | null) {
  // Pergunta de contagem -> le os documentos inteiros do departamento
  if (isAggregation(question)) {
    const listRes = await fetch(`${DOCLING_URL}/list`);
    const listData = await listRes.json();
    let files = listData.files || [];
    if (department) files = files.filter((f: any) => f.department === department);

    const parts: string[] = [];
    const sources = new Set<string>();
    for (const f of files.slice(0, 5)) {
      const url = `${DOCLING_URL}/read?department=${encodeURIComponent(f.department)}&file=${encodeURIComponent(f.file)}`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.content) {
        parts.push(`[Documento completo — ${f.file} (${f.department})]\n${d.content}`);
        sources.add(`${f.file} (${f.department})`);
      }
    }
    return { context: parts.join("\n\n"), sources: Array.from(sources) };
  }

  // Pergunta normal -> busca semantica (12 trechos)
  const searchRes = await fetch(`${DOCLING_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: question, department: department || null, match_count: 12 }),
  });
  const searchData = await searchRes.json();
  const results = searchData.results || [];
  const context = results
    .map((r: any, i: number) => `[Trecho ${i + 1} — ${r.source_file} (${r.department})]\n${r.content}`)
    .join("\n\n");
  const sources = Array.from(new Set(results.map((r: any) => `${r.source_file} (${r.department})`)));
  return { context, sources };
}

export async function POST(req: NextRequest) {
  try {
    const { question, department } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }

    const { context, sources } = await getContext(question, department || null);

    if (!context) {
      return NextResponse.json({
        answer: "Não encontrei documentos na base de conhecimento para responder. Verifique se o arquivo foi enviado pelo dashboard.",
        sources: [],
      });
    }

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
