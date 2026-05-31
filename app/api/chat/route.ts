import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOCLING_URL = "http://docling:3002";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

// Modelos: busca normal usa DeepSeek; contagem usa Gemini Flash Lite (rapido em contexto grande)
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

// Comprime texto de planilha: remove formatacao redundante de tabela markdown
function compress(text: string): string {
  const lines = text
    .split("\n")
    .map((line) =>
      line
        .replace(/\s*\|\s*/g, "|")   // tira espacos ao redor dos pipes
        .replace(/\|+/g, "|")          // colapsa pipes repetidos
        .replace(/^\|/, "")            // pipe inicial
        .replace(/\|$/, "")            // pipe final
        .replace(/\s{2,}/g, " ")      // espacos multiplos
        .trim()
    )
    .filter((line) => line && !/^[-|\s]+$/.test(line)); // remove linhas separadoras

  // Remove linhas duplicadas (overlap entre chunks repete linhas)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      unique.push(line);
    }
  }
  return unique.join("\n");
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

async function allChunks(department: string | null, companyId: string) {
  const res = await fetch(`${DOCLING_URL}/chunks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_id: companyId, department: department || null }),
  });
  const data = await res.json();
  return data.chunks || [];
}

async function askLLM(model: string, prompt: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Erro ao gerar resposta.";
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

    let context = "";
    let sources: string[] = [];
    let model = MODEL_SEARCH;
    const counting = isAggregation(question);

    if (counting) {
      // Modo contagem: todos os chunks, comprimidos, modelo rapido
      model = MODEL_COUNT;
      const chunks = await allChunks(department, profile.company_id);
      if (chunks.length > 0) {
        context = compress(chunks.map((c: any) => c.content).join("\n"));
        sources = Array.from(new Set(chunks.map((c: any) => `${c.source_file} (${c.department})`)));
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
        answer: "Não encontrei documentos na base de conhecimento da sua empresa para responder. Verifique se o arquivo foi enviado pelo dashboard.",
        sources: [],
      });
    }

    const prompt = `Você é a Sara, analista de dados do negócio. Responda à pergunta usando APENAS o conteúdo abaixo, extraído dos documentos reais da empresa. Seja direta e cite números concretos. Quando a pergunta for de contagem, CONTE cuidadosamente os itens listados. Se o conteúdo não permitir responder, diga que não há dado suficiente. Não invente.

CONTEÚDO DA BASE DE CONHECIMENTO:
${context}

PERGUNTA: ${question}

RESPOSTA:`;

    const answer = await askLLM(model, prompt);
    return NextResponse.json({ answer, sources });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
