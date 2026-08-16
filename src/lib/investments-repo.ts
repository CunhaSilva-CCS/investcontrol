import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import type { Investment as EncryptedInvestment } from "@/generated/prisma/client";
import type { InvestmentInput } from "@/lib/validation";

/**
 * The app-facing shape of an investment: name, institution, rate, principal and notes are
 * plaintext here. On disk (EncryptedInvestment) those same fields hold AES-256-GCM ciphertext —
 * this module is the only place allowed to call `prisma.investment.*` directly, so encryption
 * stays centralized instead of scattered across API routes and pages.
 */
export type Investment = Omit<EncryptedInvestment, "name" | "institution" | "rate" | "principal" | "notes"> & {
  name: string;
  institution: string;
  rate: number;
  principal: number;
  notes: string | null;
};

function decryptRow(row: EncryptedInvestment): Investment {
  return {
    ...row,
    name: decrypt(row.name),
    institution: decrypt(row.institution),
    rate: Number(decrypt(row.rate)),
    principal: Number(decrypt(row.principal)),
    notes: row.notes ? decrypt(row.notes) : null,
  };
}

function encryptInput(data: InvestmentInput) {
  return {
    name: encrypt(data.name),
    institution: encrypt(data.institution),
    type: data.type,
    indexType: data.indexType,
    rate: encrypt(String(data.rate)),
    principal: encrypt(String(data.principal)),
    applicationDate: data.applicationDate,
    maturityDate: data.maturityDate ?? null,
    liquidity: data.liquidity,
    fgcCovered: data.fgcCovered,
    notes: data.notes ? encrypt(data.notes) : null,
  };
}

export async function listInvestments(): Promise<Investment[]> {
  const rows = await prisma.investment.findMany({ orderBy: { applicationDate: "desc" } });
  return rows.map(decryptRow);
}

export async function getInvestment(id: string): Promise<Investment | null> {
  const row = await prisma.investment.findUnique({ where: { id } });
  return row ? decryptRow(row) : null;
}

export async function createInvestment(data: InvestmentInput): Promise<Investment> {
  const row = await prisma.investment.create({ data: encryptInput(data) });
  return decryptRow(row);
}

export async function updateInvestment(id: string, data: InvestmentInput): Promise<Investment | null> {
  try {
    const row = await prisma.investment.update({ where: { id }, data: encryptInput(data) });
    return decryptRow(row);
  } catch {
    return null;
  }
}

export async function deleteInvestment(id: string): Promise<boolean> {
  try {
    await prisma.investment.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
