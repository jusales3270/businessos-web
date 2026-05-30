import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "uploads", "_system");
const ALERTS_FILE = path.join(DATA_DIR, "alerts.json");

async function readAlerts() {
  try {
    const raw = await readFile(ALERTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAlerts(alerts: any[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ALERTS_FILE, JSON.stringify(alerts, null, 2));
}

export async function GET() {
  const alerts = await readAlerts();
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { severity, title, description, source, department } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const alerts = await readAlerts();
  const alert = {
    id: Date.now().toString(),
    severity: severity || "warning",
    title,
    description: description || "",
    source: source || "Sara",
    department: department || "geral",
    date: new Date().toISOString(),
    acked: false
  };
  alerts.unshift(alert);
  await writeAlerts(alerts.slice(0, 100));
  return NextResponse.json({ ok: true, alert });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const alerts = await readAlerts();
  const filtered = alerts.filter((a: any) => a.id !== id);
  await writeAlerts(filtered);
  return NextResponse.json({ ok: true });
}
