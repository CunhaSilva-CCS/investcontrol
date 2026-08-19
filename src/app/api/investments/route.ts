import { NextResponse } from "next/server";
import { listInvestments, createInvestment } from "@/lib/investments-repo";
import { investmentSchema } from "@/lib/validation";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";
import { getAuthenticatedUserOrNull } from "@/lib/auth";

export async function GET() {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  if (!(await getAuthenticatedUserOrNull())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const investments = await listInvestments();
  return NextResponse.json(investments);
}

export async function POST(request: Request) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  if (!(await getAuthenticatedUserOrNull())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json();
  const parsed = investmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const investment = await createInvestment(parsed.data);
  return NextResponse.json(investment, { status: 201 });
}
