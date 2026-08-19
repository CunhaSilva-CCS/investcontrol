import { NextResponse } from "next/server";
import { disableTotp, getAuthenticatedUserOrNull } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthenticatedUserOrNull();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  try {
    await disableTotp(user.id, code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível desativar o autenticador." }, { status: 400 });
  }
}
