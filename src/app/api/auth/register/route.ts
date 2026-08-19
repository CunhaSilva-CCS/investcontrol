import { NextResponse } from "next/server";
import { createFirstUser } from "@/lib/auth";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";

export async function POST(request: Request) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return NextResponse.json({ error: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres." }, { status: 400 });
  }
  try {
    const user = await createFirstUser(email, password);
    return NextResponse.json({ ok: true, email: user.email }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível criar a conta." }, { status: 409 });
  }
}
