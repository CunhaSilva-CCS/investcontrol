import { NextResponse } from "next/server";
import { getAuthenticatedUserOrNull, setupTotp } from "@/lib/auth";

export async function GET() {
  const user = await getAuthenticatedUserOrNull();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  return NextResponse.json(await setupTotp(user.id));
}
