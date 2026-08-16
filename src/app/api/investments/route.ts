import { NextResponse } from "next/server";
import { listInvestments, createInvestment } from "@/lib/investments-repo";
import { investmentSchema } from "@/lib/validation";

export async function GET() {
  const investments = await listInvestments();
  return NextResponse.json(investments);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = investmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const investment = await createInvestment(parsed.data);
  return NextResponse.json(investment, { status: 201 });
}
