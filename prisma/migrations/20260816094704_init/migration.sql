-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "indexType" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "principal" REAL NOT NULL,
    "applicationDate" DATETIME NOT NULL,
    "maturityDate" DATETIME,
    "liquidity" TEXT NOT NULL DEFAULT 'NO_VENCIMENTO',
    "fgcCovered" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investmentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Withdrawal_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "cdiRate" REAL NOT NULL DEFAULT 10.65,
    "selicRate" REAL NOT NULL DEFAULT 10.75,
    "ipcaRate" REAL NOT NULL DEFAULT 4.5,
    "updatedAt" DATETIME NOT NULL
);
