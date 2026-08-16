import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { investmentSchema } from "@/lib/validation";

export async function GET() {
  const investments = await prisma.investment.findMany({
    orderBy: { applicationDate: "desc" },
  });
  return NextResponse.json(investments);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = investmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const investment = await prisma.investment.create({ data: parsed.data });
  return NextResponse.json(investment, { status: 201 });
}
