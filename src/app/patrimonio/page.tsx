import { prisma } from "@/lib/prisma";
import { requireLicense } from "@/lib/license";
import { PortfolioManager } from "@/components/PortfolioManager";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  requireLicense();
  const year = new Date().getFullYear();
  const entries = await prisma.portfolioEntry.findMany({ where: { year }, orderBy: [{ institution: "asc" }, { category: "asc" }, { month: "asc" }] });
  return <PortfolioManager initialEntries={entries} initialYear={year} />;
}