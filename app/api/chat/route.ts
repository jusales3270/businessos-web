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

// Extrai o prefixo do codigo: letras iniciais antes de numero ou hifen.
// Ex: "TCNC-01" -> "TCNC", "CV5X-1" -> "CV", "CH5X-101" -> "CH"
function prefixo(codigo: string): string {
  const m = String(codigo).trim().match(/^([A-Za-z]+)/);
  return m ? m[1].toUpperCase() : "OUTROS";
}

// CONTAGEM DETERMINISTICA — feita 100% em codigo, nunca pelo LLM.
// Retorna um resumo de contagens que o LLM apenas le para responder.
function contarPorPrefixo(rows: any[]): { resumo: string; total: number; detalhe: Record<string, number> } {
  const contagem: Record<string, number> = {};
  for (const r of rows) {
    // primeira coluna do row_data e o codigo da maquina/item
    const valores = Object.values(r.row_data);
    const codigo = valores.length > 0 ? String(valores[0]) : "";
    const p = prefixo(codigo);
    contagem[p] = (contagem[p] || 0) + 1;
  }
  const linhas = Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .map(([p, n]) => `${p}: ${n}`);
  return {
    resumo: linhas.join("\n"),
    total: rows.length,
    detalhe: contagem,
  };
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

    // ---------- MODO CONTAGEM: codigo conta, LLM so redige ----------
    if (counting) {
      let query = supabase
        .from("sheet_rows")
        .select("source_file, department, row_data, row_index")
        .eq("company_id", profile.company_id)
        .order("source_file", { ascending: true })
        .order("row_index", { ascending: true });
      if (department) query = query.eq("department", department);

      const { data: rows } = await query;

      if (!rows || rows.length === 0) {
        return NextResponse.json({
          answer: "Não há planilhas estruturadas da sua empresa para contar. Envie uma planilha pelo dashboard.",
          sources: [],
        });
      }

      // CONTAGEM EXATA EM CODIGO
      const { resumo, total } = contarPorPrefixo(rows);
      const sources = Array.from(new Set(rows.map((r: any) => `${r.source_file} (${r.department})`)));

      // O LLM SO LE OS NUMEROS JA CALCULADOS — nao conta nada.
      const prompt = `Você é a Sara, analista de dados. A contagem abaixo JÁ FOI CALCULADA com exatidão pelo sistema (não recalcule, não some, não altere os números). Os itens estão agrupados pelo prefixo do código.

CONTAGEM EXATA (calculada pelo sistema):
${resumo}
TOTAL GERAL: ${total} itens

Glossário de prefixos (para você interpretar a pergunta):
- TCNC = Tornos CNC
- CV = Centros de usinagem Verticais
- CH = Centros de usinagem Horizontais
- CT = Centros de Torneamento (Integrex)
- CV5X / outros = variações

PERGUNTA DO USUÁRIO: ${question}

Responda em uma frase, usando EXATAMENTE o número já calculado acima que corresponde à pergunta. Se a pergunta for sobre "tornos CNC", use o número de TCNC. Não invente nem recalcule.`;

      const answer = await askLLM(MODEL_COUNT, prompt);
      return NextResponse.json({ answer, sources });
    }

    // ---------- MODO BUSCA: RAG qualitativo ----------
    const results = await semanticSearch(question, department, profile.company_id);
    if (results.length === 0) {
      return NextResponse.json({
        answer: "Não encontrei dados na base da sua empresa para responder. Verifique se o arquivo foi enviado pelo dashboard.",
        sources: [],
      });
    }
    const context = results
      .map((r: any, i: number) => `[Trecho ${i + 1} — ${r.source_file} (${r.department})]\n${r.content}`)
      .join("\n\n");
    const sources = Array.from(new Set(results.map((r: any) => `${r.source_file} (${r.department})`)));

    const prompt = `Você é a Sara, analista de dados do negócio. Responda usando APENAS o conteúdo abaixo. Seja direta e cite a fonte. Se não houver dado suficiente, diga.

CONTEÚDO:
${context}

PERGUNTA: ${question}

RESPOSTA:`;

    const answer = await askLLM(MODEL_SEARCH, prompt);
    return NextResponse.json({ answer, sources });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
