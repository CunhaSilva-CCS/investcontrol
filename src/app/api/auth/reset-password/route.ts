import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";

export async function POST(request: Request) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!token || password.length < 8) return NextResponse.json({ error: "Token e senha válida são obrigatórios." }, { status: 400 });
  try {
    await resetPassword(token, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível redefinir a senha." }, { status: 400 });
  }
}
