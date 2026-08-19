import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { requireLicense } from "@/lib/license";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  requireLicense();
  const { token = "" } = await searchParams;
  return <div className="min-h-[60vh] flex items-center justify-center"><Card className="w-full max-w-md"><CardHeader><CardTitle>Redefinir senha</CardTitle></CardHeader><CardContent>{token ? <ResetPasswordForm token={token} /> : <p className="text-sm text-danger">Link de recuperação inválido.</p>}</CardContent></Card></div>;
}
