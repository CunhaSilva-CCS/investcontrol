import type { IndexType, InvestmentType, Liquidity } from "@/generated/prisma/client";

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  CDB: "CDB",
  LCI: "LCI",
  LCA: "LCA",
  LC: "LC",
  TESOURO_SELIC: "Tesouro Selic",
  TESOURO_PREFIXADO: "Tesouro Prefixado",
  TESOURO_IPCA: "Tesouro IPCA+",
  POUPANCA: "Poupança",
  OUTRO: "Outro",
};

export const INDEX_TYPE_LABELS: Record<IndexType, string> = {
  CDI: "% do CDI",
  SELIC: "% da Selic",
  IPCA: "IPCA +",
  PREFIXADO: "Prefixado",
};

export const LIQUIDITY_LABELS: Record<Liquidity, string> = {
  DIARIA: "Diária",
  NO_VENCIMENTO: "No vencimento",
};

export const TYPE_COLORS: Record<InvestmentType, string> = {
  CDB: "#6366f1",
  LCI: "#22c55e",
  LCA: "#14b8a6",
  LC: "#a855f7",
  TESOURO_SELIC: "#f59e0b",
  TESOURO_PREFIXADO: "#ef4444",
  TESOURO_IPCA: "#ec4899",
  POUPANCA: "#64748b",
  OUTRO: "#94a3b8",
};

export const DEFAULT_RATE_SUFFIX: Record<IndexType, string> = {
  CDI: "% CDI",
  SELIC: "% Selic",
  IPCA: "% a.a. (+IPCA)",
  PREFIXADO: "% a.a.",
};

export function formatRate(indexType: IndexType, rate: number): string {
  switch (indexType) {
    case "CDI":
      return `${rate}% do CDI`;
    case "SELIC":
      return `${rate}% da Selic`;
    case "IPCA":
      return `IPCA + ${rate}% a.a.`;
    case "PREFIXADO":
      return `${rate}% a.a.`;
  }
}
