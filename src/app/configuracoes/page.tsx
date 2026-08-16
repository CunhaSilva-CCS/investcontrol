import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
    </div>
  );
}
