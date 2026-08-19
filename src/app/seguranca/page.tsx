import { requireUser } from "@/lib/auth";
import { requireLicense } from "@/lib/license";
import { SecurityForm } from "@/components/SecurityForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  requireLicense();
  const user = await requireUser();
  return <div className="flex flex-col gap-6 max-w-lg"><div><h1 className="text-2xl font-semibold">Segurança da conta</h1><p className="text-sm text-muted mt-1">Conta: {user.email}</p></div><Card><CardHeader><CardTitle>Verificação em duas etapas</CardTitle></CardHeader><CardContent><SecurityForm totpEnabled={user.totpEnabled} /></CardContent></Card></div>;
}
