import { prisma } from "@/lib/prisma";

export const BACKUP_FORMAT = "investe-valor-backup-v1";

type BackupData = {
  settings: Awaited<ReturnType<typeof prisma.settings.findUnique>>;
  investments: Array<Record<string, unknown>>;
  investmentMovements: Array<Record<string, unknown>>;
  portfolioEntries: Array<Record<string, unknown>>;
  users: Array<Record<string, unknown>>;
};

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  exportedAt: string;
  data: BackupData;
};

function date(value: unknown, field: string) {
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw new Error(`Data inválida no campo ${field}.`);
  return parsed;
}

function records(value: unknown, field: string): Array<Record<string, unknown>> {
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
    throw new Error(`Formato inválido no campo ${field}.`);
  }
  return value as Array<Record<string, unknown>>;
}

export async function exportBackup(): Promise<BackupFile> {
  const [settings, investments, investmentMovements, portfolioEntries, users] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.investment.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.investmentMovement.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.portfolioEntry.findMany({ orderBy: [{ year: "asc" }, { month: "asc" }] }),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return {
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    data: { settings, investments, investmentMovements, portfolioEntries, users },
  } as BackupFile;
}

export async function restoreBackup(input: unknown) {
  if (!input || typeof input !== "object" || (input as { format?: unknown }).format !== BACKUP_FORMAT) {
    throw new Error("Arquivo de backup inválido ou incompatível.");
  }
  const data = (input as { data?: unknown }).data;
  if (!data || typeof data !== "object") throw new Error("O backup não contém dados válidos.");
  const source = data as Record<string, unknown>;
  const settings = source.settings;
  const investments = records(source.investments, "investments");
  const investmentMovements = records(source.investmentMovements, "investmentMovements");
  const portfolioEntries = records(source.portfolioEntries, "portfolioEntries");
  const users = records(source.users, "users");

  await prisma.$transaction(async (tx) => {
    await tx.authSession.deleteMany();
    await tx.passwordResetToken.deleteMany();
    await tx.investmentMovement.deleteMany();
    await tx.investment.deleteMany();
    await tx.portfolioEntry.deleteMany();
    await tx.settings.deleteMany();
    await tx.user.deleteMany();

    if (settings) {
      const item = settings as Record<string, unknown>;
      await tx.settings.create({
        data: {
          id: String(item.id ?? "singleton"),
          cdiRate: Number(item.cdiRate),
          selicRate: Number(item.selicRate),
          ipcaRate: Number(item.ipcaRate),
          usdToBrl: Number(item.usdToBrl),
          eurToBrl: Number(item.eurToBrl),
          updatedAt: date(item.updatedAt, "settings.updatedAt"),
        },
      });
    }

    for (const item of users) {
      await tx.user.create({ data: {
        id: String(item.id), email: String(item.email), passwordHash: String(item.passwordHash),
        totpSecret: item.totpSecret == null ? null : String(item.totpSecret), totpEnabled: Boolean(item.totpEnabled),
        createdAt: date(item.createdAt, "users.createdAt"), updatedAt: date(item.updatedAt, "users.updatedAt"),
      } });
    }

    for (const item of portfolioEntries) {
      await tx.portfolioEntry.create({ data: {
        id: String(item.id), year: Number(item.year), month: Number(item.month), institution: String(item.institution), category: String(item.category),
        currency: item.currency as "BRL" | "USD" | "EUR", value: Number(item.value), contributions: Number(item.contributions), withdrawals: Number(item.withdrawals),
        createdAt: date(item.createdAt, "portfolioEntries.createdAt"), updatedAt: date(item.updatedAt, "portfolioEntries.updatedAt"),
      } });
    }

    for (const item of investments) {
      await tx.investment.create({ data: {
        id: String(item.id), name: String(item.name), institution: String(item.institution), type: item.type as never, currency: item.currency as never,
        indexType: item.indexType as never, rate: String(item.rate), principal: String(item.principal), applicationDate: date(item.applicationDate, "investments.applicationDate"),
        maturityDate: item.maturityDate == null ? null : date(item.maturityDate, "investments.maturityDate"), liquidity: item.liquidity as never,
        fgcCovered: Boolean(item.fgcCovered), notes: item.notes == null ? null : String(item.notes), createdAt: date(item.createdAt, "investments.createdAt"), updatedAt: date(item.updatedAt, "investments.updatedAt"),
      } });
    }

    for (const item of investmentMovements) {
      await tx.investmentMovement.create({ data: {
        id: String(item.id), investmentId: String(item.investmentId), type: item.type as never, amount: String(item.amount), date: date(item.date, "investmentMovements.date"),
        notes: item.notes == null ? null : String(item.notes), createdAt: date(item.createdAt, "investmentMovements.createdAt"),
      } });
    }
  });
}
