import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { investmentSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) {
    return NextResponse.json({ error: "Investimento não encontrado" }, { status: 404 });
  }
  return NextResponse.json(investment);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = investmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const investment = await prisma.investment.update({ where: { id }, data: parsed.data });
    return NextResponse.json(investment);
  } catch {
    return NextResponse.json({ error: "Investimento não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.investment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Investimento não encontrado" }, { status: 404 });
  }
}
