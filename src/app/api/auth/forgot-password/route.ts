import { NextResponse } from "next/server";
import { createPasswordReset } from "@/lib/auth";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";

export async function POST(request: Request) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  try {
    await createPasswordReset(email);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível enviar o e-mail." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, message: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação." });
}
