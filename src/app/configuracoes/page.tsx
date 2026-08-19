import { prisma } from "@/lib/prisma";
import { requireLicense } from "@/lib/license";
import { requireUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";
import { PortfolioImportForm } from "@/components/PortfolioImportForm";
import { BackupRestoreForm } from "@/components/BackupRestoreForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const license = requireLicense();
  await requireUser();
  const settings =
    (await prisma.settings.findUnique({ where: { id: "singleton" } })) ??
    (await prisma.settings.create({ data: { id: "singleton" } }));

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <header className="border-b border-border pb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Sistema</p>
        <h1 className="text-3xl font-semibold mt-1">Configurações</h1>
        <p className="text-sm text-muted mt-2 max-w-2xl">
          Controle as premissas dos cálculos, os arquivos da carteira e a segurança dos seus dados.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-3"><h2 className="text-lg font-semibold">Cálculos e conversões</h2><p className="text-sm text-muted mt-1">Esses valores alimentam as projeções dos investimentos e o Dashboard do Patrimônio.</p></div>
            <SettingsForm settings={{ cdiRate: settings.cdiRate, selicRate: settings.selicRate, ipcaRate: settings.ipcaRate, usdToBrl: settings.usdToBrl, eurToBrl: settings.eurToBrl }} />
          </section>

          <section>
            <div className="mb-3"><h2 className="text-lg font-semibold">Proteção da conta</h2><p className="text-sm text-muted mt-1">Gerencie o autenticador de dois fatores da sua conta.</p></div>
            <Card><CardContent className="pt-5 flex items-center justify-between gap-4"><div><p className="font-medium">Autenticador externo</p><p className="text-xs text-muted mt-1">Google Authenticator, Authy ou Microsoft Authenticator.</p></div><Link href="/seguranca" className="shrink-0 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90">Abrir segurança</Link></CardContent></Card>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section><div className="mb-3"><h2 className="text-lg font-semibold">Dados da carteira</h2><p className="text-sm text-muted mt-1">Importe ou preserve seus dados locais.</p></div><PortfolioImportForm /></section>
          <BackupRestoreForm />
          <Card><CardHeader><CardTitle>Licença</CardTitle></CardHeader><CardContent><div className="flex items-start gap-3"><span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">✓</span><div><p className="text-sm font-medium">{license.customer}</p>{license.email && <p className="text-xs text-muted mt-0.5">{license.email}</p>}<p className="text-xs text-muted mt-2">{license.expiresAt ? `Válida até ${new Date(license.expiresAt).toLocaleDateString("pt-BR")}` : "Licença sem data de expiração"}</p></div></div></CardContent></Card>
        </aside>
      </div>
    </div>
  );
}
