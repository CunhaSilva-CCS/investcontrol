import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser, hasUsers } from "@/lib/auth";
import { requireLicense } from "@/lib/license";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  requireLicense();
  if (await getCurrentUser()) redirect("/");
  if (!(await hasUsers())) redirect("/cadastro");
  return <div className="min-h-[60vh] flex items-center justify-center"><Card className="w-full max-w-md"><CardHeader><CardTitle>Entrar no Investe Valor</CardTitle></CardHeader><CardContent><LoginForm /></CardContent></Card></div>;
}
