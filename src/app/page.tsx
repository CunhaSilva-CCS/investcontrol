import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listInvestments } from "@/lib/investments-repo";
import { requireLicense } from "@/lib/license";
import { projectValue } from "@/lib/investment-calc";
import { formatBRL, formatPercent, toBRL } from "@/lib/investment-calc";
import { INVESTMENT_TYPE_LABELS, TYPE_COLORS } from "@/lib/labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PortfolioPieChart } from "@/components/PortfolioPieChart";
import { MaturityList } from "@/components/MaturityList";
import type { InvestmentType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

async function getSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  return settings ?? (await prisma.settings.create({ data: { id: "singleton" } }));
}

export default async function DashboardPage() {
  requireLicense();
  const [investments, settings] = await Promise.all([listInvestments(), getSettings()]);

  const now = new Date();

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
        <h1 className="text-2xl font-semibold">Bem-vindo ao Investe Valor</h1>
        <p className="text-muted max-w-md">
          Você ainda não cadastrou nenhum investimento. Comece adicionando seu primeiro CDB, LCI, LCA ou outro
          controle financeiro.
        </p>
        <Link href="/investimentos">
          <Button>Adicionar investimento</Button>
        </Link>
      </div>
    );
  }

  const projections = investments.map((inv) => ({ inv, proj: projectValue(inv, settings, now) }));

  const totalPrincipal = projections.reduce((sum, p) => sum + toBRL(p.proj.principal, p.inv.currency, settings), 0);
  const totalNetValue = projections.reduce((sum, p) => sum + toBRL(p.proj.netValue, p.inv.currency, settings), 0);
  const totalNetGain = totalNetValue - totalPrincipal;
  const netGainPercent = totalPrincipal > 0 ? (totalNetGain / totalPrincipal) * 100 : 0;

  const byType = new Map<InvestmentType, number>();
  for (const { inv, proj } of projections) {
    byType.set(inv.type, (byType.get(inv.type) ?? 0) + toBRL(proj.netValue, inv.currency, settings));
  }
  const chartData = Array.from(byType.entries())
    .map(([type, value]) => ({
      type,
      label: INVESTMENT_TYPE_LABELS[type],
      value,
      color: TYPE_COLORS[type],
    }))
    .sort((a, b) => b.value - a.value);

  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const upcoming = investments
    .filter((inv) => inv.maturityDate && inv.maturityDate >= now && inv.maturityDate <= in90Days)
    .sort((a, b) => (a.maturityDate! < b.maturityDate! ? -1 : 1))
    .map((inv) => ({
      id: inv.id,
      name: inv.name,
      institution: inv.institution,
      type: inv.type,
      maturityDate: inv.maturityDate!.toISOString(),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <Link href="/investimentos">
          <Button>+ Novo investimento</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total investido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatBRL(totalPrincipal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Valor líquido estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatBRL(totalNetValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidade líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${totalNetGain >= 0 ? "text-success" : "text-danger"}`}>
              {formatBRL(totalNetGain)}
            </p>
            <p className="text-xs text-muted mt-1">{formatPercent(netGainPercent)} sobre o investido</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Investimentos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{investments.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioPieChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Próximos vencimentos (90 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <MaturityList items={upcoming} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
