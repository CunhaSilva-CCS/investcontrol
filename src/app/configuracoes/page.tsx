import { prisma } from "@/lib/prisma";
import { requireLicense } from "@/lib/license";
import { SettingsForm } from "@/components/SettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const license = requireLicense();
  const settings =
    (await prisma.settings.findUnique({ where: { id: "singleton" } })) ??
    (await prisma.settings.create({ data: { id: "singleton" } }));

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted mt-1">
          Defina as taxas atuais usadas para projetar o valor dos seus investimentos indexados.
        </p>
      </div>
      <SettingsForm
        settings={{
          cdiRate: settings.cdiRate,
          selicRate: settings.selicRate,
          ipcaRate: settings.ipcaRate,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Licença</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Licenciado para <strong>{license.customer}</strong>
          </p>
          {license.email && <p className="text-xs text-muted mt-0.5">{license.email}</p>}
          <p className="text-xs text-muted mt-2">
            {license.expiresAt
              ? `Válida até ${new Date(license.expiresAt).toLocaleDateString("pt-BR")}`
              : "Licença sem data de expiração"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
