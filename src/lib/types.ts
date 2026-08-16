import type { Investment, Settings } from "@/generated/prisma/client";

export type InvestmentDTO = Omit<Investment, "applicationDate" | "maturityDate" | "createdAt" | "updatedAt"> & {
  applicationDate: string;
  maturityDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SettingsDTO = Omit<Settings, "updatedAt"> & { updatedAt: string };

export function serializeInvestment(investment: Investment): InvestmentDTO {
  return {
    ...investment,
    applicationDate: investment.applicationDate.toISOString(),
    maturityDate: investment.maturityDate ? investment.maturityDate.toISOString() : null,
    createdAt: investment.createdAt.toISOString(),
    updatedAt: investment.updatedAt.toISOString(),
  };
}
