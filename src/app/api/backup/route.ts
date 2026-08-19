import { NextResponse } from "next/server";
import { getAuthenticatedUserOrNull } from "@/lib/auth";
import { getLicenseOrNull, licenseErrorResponse } from "@/lib/license";
import { exportBackup, restoreBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

async function requireAccess() {
  if (!getLicenseOrNull()) return licenseErrorResponse();
  if (!(await getAuthenticatedUserOrNull())) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await requireAccess();
  if (denied) return denied;
  const backup = await exportBackup();
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="investe-valor-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const denied = await requireAccess();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  try {
    await restoreBackup(body);
    return NextResponse.json({ ok: true, message: "Backup restaurado. Entre novamente para continuar." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível restaurar o backup." }, { status: 400 });
  }
}
