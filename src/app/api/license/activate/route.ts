import { NextResponse } from "next/server";
import { activateLicense } from "@/lib/license";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";

  if (!key.trim()) {
    return NextResponse.json({ error: "Informe a chave de licença." }, { status: 400 });
  }

  const result = activateLicense(key);
  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ ok: true, customer: result.payload.customer });
}
