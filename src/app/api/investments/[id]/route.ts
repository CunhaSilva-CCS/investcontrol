import { NextResponse } from "next/server";
import { getInvestment, updateInvestment, deleteInvestment } from "@/lib/investments-repo";
import { investmentSchema } from "@/lib/validation";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";
import { getAuthenticatedUserOrNull } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  if (!(await getAuthenticatedUserOrNull())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const investment = await getInvestment(id);
  if (!investment) {
    return NextResponse.json({ error: "Investimento não encontrado" }, { status: 404 });
  }
  return NextResponse.json(investment);
}

export async function PUT(request: Request, { params }: Params) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  if (!(await getAuthenticatedUserOrNull())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = investmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const investment = await updateInvestment(id, parsed.data);
  if (!investment) {
    return NextResponse.json({ error: "Investimento não encontrado" }, { status: 404 });
  }
  return NextResponse.json(investment);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  if (!(await getAuthenticatedUserOrNull())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const ok = await deleteInvestment(id);
  if (!ok) {
    return NextResponse.json({ error: "Investimento não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
