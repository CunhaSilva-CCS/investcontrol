import { z } from "zod";

export const investmentTypeValues = [
  "CDB",
  "LCI",
  "LCA",
  "LC",
  "TESOURO_SELIC",
  "TESOURO_PREFIXADO",
  "TESOURO_IPCA",
  "POUPANCA",
  "OUTRO",
] as const;

export const indexTypeValues = ["CDI", "SELIC", "IPCA", "PREFIXADO"] as const;

export const liquidityValues = ["DIARIA", "NO_VENCIMENTO"] as const;
export const currencyValues = ["BRL", "USD", "EUR"] as const;

export const investmentSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome"),
  institution: z.string().trim().min(1, "Informe a instituição"),
  type: z.enum(investmentTypeValues),
  currency: z.enum(currencyValues).default("BRL"),
  indexType: z.enum(indexTypeValues),
  rate: z.coerce.number().positive("Taxa deve ser maior que zero"),
  principal: z.coerce.number().positive("Valor investido deve ser maior que zero"),
  applicationDate: z.coerce.date(),
  maturityDate: z.coerce.date().nullable().optional(),
  liquidity: z.enum(liquidityValues).default("NO_VENCIMENTO"),
  fgcCovered: z.coerce.boolean().default(true),
  notes: z.string().trim().optional().nullable(),
});

export type InvestmentInput = z.infer<typeof investmentSchema>;

export const settingsSchema = z.object({
  cdiRate: z.coerce.number().positive(),
  selicRate: z.coerce.number().positive(),
  ipcaRate: z.coerce.number().min(0),
  usdToBrl: z.coerce.number().positive(),
  eurToBrl: z.coerce.number().positive(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
