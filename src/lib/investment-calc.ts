import { differenceInBusinessDays } from "date-fns";
import type { Currency, IndexType, InvestmentType } from "@/generated/prisma/client";

export type RatesSettings = {
  cdiRate: number;
  selicRate: number;
  ipcaRate: number;
  usdToBrl: number;
  eurToBrl: number;
};

export type InvestmentLike = {
  type: InvestmentType;
  indexType: IndexType;
  rate: number;
  principal: number;
  currency: Currency;
  applicationDate: Date;
  maturityDate: Date | null;
};

const BUSINESS_DAYS_PER_YEAR = 252;

const TAX_EXEMPT_TYPES: InvestmentType[] = ["LCI", "LCA", "POUPANCA"];

export function isTaxExempt(type: InvestmentType): boolean {
  return TAX_EXEMPT_TYPES.includes(type);
}

export function calendarDaysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/** Counts weekdays; exchange-specific holidays are not modeled by this local projection. */
function businessDaysBetween(start: Date, end: Date): number {
  return Math.max(0, differenceInBusinessDays(end, start));
}

/** Annual equivalent rate (as a decimal, e.g. 0.12 for 12%) that the position grows at, before compounding basis is applied. */
export function annualRate(inv: InvestmentLike, rates: RatesSettings): number {
  switch (inv.indexType) {
    case "CDI":
      return (rates.cdiRate / 100) * (inv.rate / 100);
    case "SELIC":
      return (rates.selicRate / 100) * (inv.rate / 100);
    case "IPCA":
      return (1 + rates.ipcaRate / 100) * (1 + inv.rate / 100) - 1;
    case "PREFIXADO":
      return inv.rate / 100;
  }
}

/** Gross growth factor accrued between applicationDate and asOfDate (capped at maturityDate, if any). */
export function grossFactor(inv: InvestmentLike, rates: RatesSettings, asOfDate: Date): number {
  const effectiveEnd = inv.maturityDate && inv.maturityDate < asOfDate ? inv.maturityDate : asOfDate;
  const calendarDays = calendarDaysBetween(inv.applicationDate, effectiveEnd);
  if (calendarDays <= 0) return 1;
  const businessDays = businessDaysBetween(inv.applicationDate, effectiveEnd);
  if (businessDays <= 0) return 1;
  const rate = annualRate(inv, rates);
  return Math.pow(1 + rate, businessDays / BUSINESS_DAYS_PER_YEAR);
}

/** Regressive income tax rate (IR) based on days held, per Brazilian fixed-income rules. */
export function irRate(daysHeld: number): number {
  if (daysHeld <= 180) return 0.225;
  if (daysHeld <= 360) return 0.2;
  if (daysHeld <= 720) return 0.175;
  return 0.15;
}

/** Regressive IOF rate applied to gains when redeemed within 30 days of application; 0 afterwards. */
const IOF_TABLE = [
  96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0,
];
export function iofRate(daysHeld: number): number {
  if (daysHeld >= 30) return 0;
  const idx = Math.max(0, Math.min(IOF_TABLE.length - 1, daysHeld));
  return IOF_TABLE[idx] / 100;
}

export type Projection = {
  daysHeld: number;
  principal: number;
  grossValue: number;
  grossGain: number;
  iof: number;
  ir: number;
  netValue: number;
  netGain: number;
};

export function projectValue(inv: InvestmentLike, rates: RatesSettings, asOfDate: Date): Projection {
  const effectiveEnd = inv.maturityDate && inv.maturityDate < asOfDate ? inv.maturityDate : asOfDate;
  const daysHeld = calendarDaysBetween(inv.applicationDate, effectiveEnd);
  const factor = grossFactor(inv, rates, asOfDate);
  const grossValue = inv.principal * factor;
  const grossGain = grossValue - inv.principal;

  const iof = Math.max(0, grossGain) * iofRate(daysHeld);
  const gainAfterIof = grossGain - iof;
  const ir = isTaxExempt(inv.type) ? 0 : Math.max(0, gainAfterIof) * irRate(daysHeld);
  const netValue = Math.max(0, inv.principal + gainAfterIof - ir);

  return {
    daysHeld,
    principal: inv.principal,
    grossValue,
    grossGain,
    iof,
    ir,
    netValue,
    netGain: netValue - inv.principal,
  };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatCurrency(value: number, currency: Currency): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency });
}

export function toBRL(value: number, currency: Currency, rates: RatesSettings): number {
  if (currency === "USD") return value * rates.usdToBrl;
  if (currency === "EUR") return value * rates.eurToBrl;
  return value;
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}
