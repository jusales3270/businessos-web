import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOCLING_URL = "http://docling:3002";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";
const MODEL = "deepseek/deepseek-v4-flash";
const HISTORICO_N = 10; // ultimas mensagens carregadas como memoria

const AGG_HINTS = [
  "quant", "total", "soma", "quantos", "quantas", "numero de", "número de",
  "media", "média", "maior", "menor", "lista", "liste", "todos", "todas",
  "por marca", "por modelo", "por tipo", "contagem", "conte",
];
function isAggregation(q: string): boolean {
  const low = q.toLowerCase();
  return AGG_HINTS.some((h) => low.includes(h));
}

async function askLLM(messages: any[], jsonMode = false): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

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

    // Grava a mensagem do usuario
    await supabase.from("chat_messages").insert({
      company_id: profile.company_id, user_id: user.id, role: "user", content: question,
    });

    // Carrega historico recente (memoria da conversa)
    const { data: histRows } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(HISTORICO_N);
    const historico = (histRows || []).reverse(); // ordem cronologica

    let answer = "";
    let sources: string[] = [];

    if (isAggregation(question)) {
      let query = supabase
        .from("sheet_rows")
        .select("source_file, department, row_data, row_index")
        .eq("company_id", profile.company_id)
        .order("source_file", { ascending: true })
        .order("row_index", { ascending: true });
      if (department) query = query.eq("department", department);
      const { data: rows } = await query;

      if (!rows || rows.length === 0) {
        answer = "Não há planilhas estruturadas da sua empresa. Envie uma planilha pelo dashboard.";
      } else {
        const colunas = Object.keys(rows[0].row_data);
        sources = Array.from(new Set(rows.map((r: any) => `${r.source_file} (${r.department})`)));

        // PASSO 1: LLM gera filtro OU pede esclarecimento (com memoria da conversa)
        const sysFilter = `Você converte perguntas em filtros para contar linhas de uma planilha. NÃO conte.

Colunas disponíveis: ${JSON.stringify(colunas)}
Amostra de 3 linhas: ${rows.slice(0, 3).map((r: any) => JSON.stringify(r.row_data)).join(" ")}
Operadores: "contem","igual","comeca_com","termina_com","diferente","nao_vazio".
Regra de negócio: no código, prefixo TCNC=tornos, CV=centros verticais, CH=horizontais, CT=torneamento.

IMPORTANTE — AMBIGUIDADE: se o termo da pergunta puder se referir a MAIS DE UMA coluna (ex: "Mazak" pode ser o comando na coluna "Marca Comando" OU a marca da máquina em "Marca/Modelo"), NÃO escolha sozinho. Peça esclarecimento.

Responda APENAS JSON:
- Se claro: {"acao":"contar","filtros":[{"coluna":"...","operador":"...","valor":"..."}],"descricao":"..."}
- Se ambíguo ou faltar info: {"acao":"esclarecer","pergunta":"sua pergunta curta ao usuário"}
- Sem filtro (contar tudo): {"acao":"contar","filtros":[],"descricao":"total de itens"}`;

        const msgs = [
          { role: "system", content: sysFilter },
          ...historico.map((h) => ({ role: h.role, content: h.content })),
        ];
        let parsed: any = {};
        try { parsed = JSON.parse(await askLLM(msgs, true)); } catch { parsed = { acao: "contar", filtros: [] }; }

        if (parsed.acao === "esclarecer" && parsed.pergunta) {
          answer = parsed.pergunta; // a Sara devolve a pergunta de esclarecimento
        } else {
          const filtros = Array.isArray(parsed.filtros) ? parsed.filtros : [];
          const descricao = parsed.descricao || "itens";
          // PASSO 2: codigo conta (deterministico)
          let contagem = 0;
          for (const r of rows) {
            const ok = filtros.every((f: any) => {
              const val = r.row_data[f.coluna];
              if (val === undefined) return false;
              return matchFilter(String(val), f.operador, f.valor);
            });
            if (ok) contagem++;
          }
          // PASSO 3: LLM redige com o numero exato
          const respMsgs = [
            { role: "system", content: `Você é a Sara, analista de dados. O sistema já contou com exatidão (não recalcule). Pergunta: "${question}". Contado: ${descricao}. RESULTADO EXATO: ${contagem}. Total na base: ${rows.length}. Responda em uma frase curta usando exatamente ${contagem}.` },
          ];
          answer = await askLLM(respMsgs);
        }
      }
    } else {
      // BUSCA QUALITATIVA: RAG
      const sres = await fetch(`${DOCLING_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, department: department || null, company_id: profile.company_id, match_count: 12 }),
      });
      const sdata = await sres.json();
      const results = sdata.results || [];
      if (results.length === 0) {
        answer = "Não encontrei dados na base da sua empresa para responder. Verifique se o arquivo foi enviado pelo dashboard.";
      } else {
        const context = results.map((r: any, i: number) => `[Trecho ${i + 1} — ${r.source_file} (${r.department})]\n${r.content}`).join("\n\n");
        sources = Array.from(new Set(results.map((r: any) => `${r.source_file} (${r.department})`)));
        const respMsgs = [
          { role: "system", content: "Você é a Sara, analista de dados do negócio. Responda usando APENAS o conteúdo fornecido. Seja direta e cite a fonte. Se não houver dado suficiente, diga." },
          ...historico.map((h) => ({ role: h.role, content: h.content })),
          { role: "user", content: `CONTEÚDO:\n${context}\n\nPERGUNTA: ${question}` },
        ];
        answer = await askLLM(respMsgs);
      }
    }

    // Grava a resposta da Sara
    await supabase.from("chat_messages").insert({
      company_id: profile.company_id, user_id: user.id, role: "assistant", content: answer,
    });

    return NextResponse.json({ answer, sources });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
