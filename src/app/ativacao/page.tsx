import { redirect } from "next/navigation";
import { readActivatedLicense } from "@/lib/license";
import { ActivationForm } from "@/components/ActivationForm";

export const dynamic = "force-dynamic";

export default function AtivacaoPage() {
  if (readActivatedLicense().valid) {
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ative o Investe Valor</h1>
        <p className="text-muted max-w-md mt-2">
          Cole abaixo a chave de licença que você recebeu na compra para liberar o acesso.
        </p>
      </div>
      <ActivationForm />
    </div>
  );
}
