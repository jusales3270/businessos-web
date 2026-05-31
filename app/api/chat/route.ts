import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOCLING_URL = "http://docling:3002";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";
const MODEL = "deepseek/deepseek-v4-flash";

const AGG_HINTS = [
  "quant", "total", "soma", "quantos", "quantas", "numero de", "número de",
  "media", "média", "maior", "menor", "lista", "liste", "todos", "todas",
  "por marca", "por modelo", "por tipo", "contagem", "conte",
];
function isAggregation(q: string): boolean {
  const low = q.toLowerCase();
  return AGG_HINTS.some((h) => low.includes(h));
}

async function askLLM(prompt: string, jsonMode = false): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Aplica um filtro estruturado a uma linha. Operadores suportados.
function matchFilter(value: string, operador: string, alvo: string): boolean {
  const v = (value ?? "").toString().toLowerCase().trim();
  const a = (alvo ?? "").toString().toLowerCase().trim();
  switch (operador) {
    case "contem": return v.includes(a);
    case "igual": return v === a;
    case "comeca_com": return v.startsWith(a);
    case "termina_com": return v.endsWith(a);
    case "diferente": return v !== a;
    case "nao_vazio": return v !== "";
    default: return v.includes(a);
  }
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

    // ---------- CONTAGEM/AGREGACAO: text-to-filter + contagem em codigo ----------
    if (isAggregation(question)) {
      // Busca as linhas da empresa (RLS + filtro explicito)
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
          answer: "Não há planilhas estruturadas da sua empresa. Envie uma planilha pelo dashboard.",
          sources: [],
        });
      }

      const colunas = Object.keys(rows[0].row_data);
      const sources = Array.from(new Set(rows.map((r: any) => `${r.source_file} (${r.department})`)));

      // PASSO 1: LLM traduz a pergunta em filtros estruturados (nao conta)
      const filterPrompt = `Você converte perguntas em filtros estruturados para contar linhas de uma planilha. NÃO conte nada, apenas gere o filtro.

Colunas disponíveis: ${JSON.stringify(colunas)}

Amostra de 3 linhas (para entender os valores):
${rows.slice(0, 3).map((r: any) => JSON.stringify(r.row_data)).join("\n")}

Operadores válidos: "contem", "igual", "comeca_com", "termina_com", "diferente", "nao_vazio".

Regra de negócio conhecida: na coluna de código, o prefixo indica o tipo — TCNC=tornos CNC, CV=centros verticais, CH=centros horizontais, CT=centros de torneamento.

Pergunta: "${question}"

Responda APENAS um JSON com este formato (sem texto extra):
{"filtros":[{"coluna":"NOME_EXATO_DA_COLUNA","operador":"OPERADOR","valor":"VALOR"}],"descricao":"o que está sendo contado"}

Se a pergunta pede contagem de tudo sem filtro, use "filtros":[]. Combine múltiplos filtros se necessário (todos devem bater - E lógico).`;

      let filtros: any[] = [];
      let descricao = "itens";
      try {
        const raw = await askLLM(filterPrompt, true);
        const parsed = JSON.parse(raw);
        filtros = Array.isArray(parsed.filtros) ? parsed.filtros : [];
        descricao = parsed.descricao || "itens";
      } catch {
        filtros = [];
      }

      // PASSO 2: codigo conta as linhas que batem com TODOS os filtros (deterministico)
      let contagem = 0;
      for (const r of rows) {
        const ok = filtros.every((f) => {
          const val = r.row_data[f.coluna];
          if (val === undefined) return false;
          return matchFilter(String(val), f.operador, f.valor);
        });
        if (ok) contagem++;
      }

      // PASSO 3: LLM apenas redige a resposta com o numero ja calculado
      const respPrompt = `Você é a Sara, analista de dados. O sistema já contou com exatidão (não recalcule).

Pergunta do usuário: "${question}"
O que foi contado: ${descricao}
RESULTADO EXATO calculado pelo sistema: ${contagem}
Total de linhas na base: ${rows.length}

Responda em uma frase curta e direta, usando exatamente o número ${contagem}.`;

      const answer = await askLLM(respPrompt);
      return NextResponse.json({ answer, sources, debug: { filtros, contagem } });
    }

    // ---------- BUSCA QUALITATIVA: RAG ----------
    const sres = await fetch(`${DOCLING_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: question, department: department || null, company_id: profile.company_id, match_count: 12 }),
    });
    const sdata = await sres.json();
    const results = sdata.results || [];
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
    const answer = await askLLM(prompt);
    return NextResponse.json({ answer, sources });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
