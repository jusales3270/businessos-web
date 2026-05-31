import * as XLSX from "xlsx";

export interface SheetRow {
  row_index: number;
  row_data: Record<string, string>;
}

// Heuristica para detectar uma linha de cabecalho: tem varias celulas
// preenchidas e contem termos tipicos de cabecalho.
const HEADER_HINTS = ["codigo", "código", "nome", "modelo", "marca", "item", "produto", "sku", "descricao", "descrição", "valor", "quantidade", "data", "tipo", "status"];

function norm(s: any): string {
  return (s === null || s === undefined ? "" : String(s)).trim();
}

function looksLikeHeader(cells: string[]): boolean {
  const filled = cells.filter((c) => c).length;
  if (filled < 2) return false;
  const low = cells.map((c) => c.toLowerCase());
  return low.some((c) => HEADER_HINTS.some((h) => c.includes(h)));
}

function looksLikeTitle(cells: string[]): boolean {
  // linha de titulo de bloco: so a primeira celula preenchida, resto vazio
  const filled = cells.filter((c) => c).length;
  return filled === 1 && !!cells[0];
}

// Recebe o buffer do arquivo e devolve linhas estruturadas.
// Lida com multiplos blocos: cada vez que encontra um cabecalho, passa a usa-lo.
export function parseSheet(buffer: Buffer, filename: string): SheetRow[] {
  const isCsv = filename.toLowerCase().endsWith(".csv");
  const wb = XLSX.read(buffer, { type: "buffer", raw: false });
  const out: SheetRow[] = [];
  let outIndex = 0;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    let currentHeader: string[] | null = null;

    for (const rawRow of matrix) {
      const cells = rawRow.map(norm);
      const filled = cells.filter((c) => c).length;
      if (filled === 0) continue; // linha vazia

      if (looksLikeHeader(cells)) {
        currentHeader = cells;
        continue;
      }
      if (looksLikeTitle(cells)) {
        continue; // titulo de bloco, ignora
      }
      if (!currentHeader) {
        // ainda nao achou cabecalho; ignora preambulo
        continue;
      }

      // linha de dados: mapeia celula -> cabecalho
      const row_data: Record<string, string> = {};
      for (let i = 0; i < currentHeader.length; i++) {
        const key = currentHeader[i] || `col_${i}`;
        const val = cells[i] ?? "";
        if (key) row_data[key] = val;
      }
      // so grava se tem ao menos um valor nao-vazio
      if (Object.values(row_data).some((v) => v)) {
        out.push({ row_index: outIndex++, row_data });
      }
    }
  }

  return out;
}

export function isSpreadsheet(filename: string): boolean {
  const f = filename.toLowerCase();
  return f.endsWith(".xlsx") || f.endsWith(".xls") || f.endsWith(".csv");
}
