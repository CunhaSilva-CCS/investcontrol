import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";

export async function POST(request: Request) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const totpCode = typeof body?.totpCode === "string" ? body.totpCode : undefined;
  const result = await authenticate(email, password, totpCode);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === "MFA_REQUIRED" ? 428 : 401 });
  }
  return NextResponse.json({ ok: true, email: result.user.email });
}
