import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { requireLicense } from "@/lib/license";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  requireLicense();
  return <div className="min-h-[60vh] flex items-center justify-center"><Card className="w-full max-w-md"><CardHeader><CardTitle>Recuperar senha</CardTitle></CardHeader><CardContent><p className="text-sm text-muted mb-4">Enviaremos um link temporário para o e-mail cadastrado.</p><ForgotPasswordForm /></CardContent></Card></div>;
}
