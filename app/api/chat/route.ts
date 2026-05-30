import { NextRequest, NextResponse } from "next/server";

const DOCLING_URL = "http://docling:3002";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { question, department } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }

    // 1. Busca semantica no pgvector (via Docling /search — embedding OpenAI)
    const searchRes = await fetch(`${DOCLING_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: question,
        department: department || null,
        match_count: 6,
      }),
    });
    const searchData = await searchRes.json();
    const results = searchData.results || [];

    if (results.length === 0) {
      return NextResponse.json({
        answer: "Não encontrei nenhum documento na base de conhecimento que responda a essa pergunta. Verifique se o arquivo relevante foi enviado pelo dashboard.",
        sources: [],
      });
    }

    // 2. Monta o contexto a partir dos trechos recuperados
    const context = results
      .map((r: any, i: number) => `[Trecho ${i + 1} — ${r.source_file} (${r.department})]\n${r.content}`)
      .join("\n\n");

    const sources = Array.from(
      new Set(results.map((r: any) => `${r.source_file} (${r.department})`))
    );

    // 3. Gera a resposta com DeepSeek via OpenRouter
    const prompt = `Você é a Sara, analista de dados do negócio. Responda à pergunta usando APENAS os trechos abaixo, extraídos dos documentos reais da empresa. Seja direta e cite números concretos. Se os trechos não contiverem a resposta, diga que não há dado suficiente. Não invente.

TRECHOS DA BASE DE CONHECIMENTO:
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
