import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validation";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";
import { getAuthenticatedUserOrNull } from "@/lib/auth";

async function getOrCreateSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: "singleton" } });
}

export async function GET() {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  if (!(await getAuthenticatedUserOrNull())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  if (!(await getAuthenticatedUserOrNull())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await getOrCreateSettings();
  const settings = await prisma.settings.update({
    where: { id: "singleton" },
    data: parsed.data,
  });
  return NextResponse.json(settings);
}
