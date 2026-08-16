import { prisma } from "@/lib/prisma";
import { serializeInvestment } from "@/lib/types";
import { InvestmentsManager } from "@/components/InvestmentsManager";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const [investments, settings] = await Promise.all([
    prisma.investment.findMany({ orderBy: { applicationDate: "desc" } }),
    prisma.settings.findUnique({ where: { id: "singleton" } }).then((s) => s ?? prisma.settings.create({ data: { id: "singleton" } })),
  ]);
  const dtos = investments.map(serializeInvestment);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Investimentos</h1>
          <p className="text-sm text-muted mt-1">Gerencie seus CDBs, LCIs, LCAs, Tesouro Direto e outros.</p>
        </div>
      </div>
      <InvestmentsManager initialInvestments={dtos} rates={settings} />
    </div>
  );
}
