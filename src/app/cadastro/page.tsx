import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RegisterForm } from "@/components/RegisterForm";
import { getCurrentUser, hasUsers } from "@/lib/auth";
import { requireLicense } from "@/lib/license";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  requireLicense();
  if (await getCurrentUser()) redirect("/");
  if (await hasUsers()) redirect("/login");
  return <div className="min-h-[60vh] flex items-center justify-center"><Card className="w-full max-w-md"><CardHeader><CardTitle>Criar conta local</CardTitle></CardHeader><CardContent><p className="text-sm text-muted mb-4">Crie a conta que protegerá os dados deste aplicativo.</p><RegisterForm /></CardContent></Card></div>;
}
