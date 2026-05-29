import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const filename = decodeURIComponent(name);
  const uploadDir = path.join(process.cwd(), "uploads");
  const filepath = path.join(uploadDir, filename);

  try {
    await unlink(filepath);
    await fetch("http://10.0.1.20:3002/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename })
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
