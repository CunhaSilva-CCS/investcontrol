-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "indexType" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "principal" TEXT NOT NULL,
    "applicationDate" DATETIME NOT NULL,
    "maturityDate" DATETIME,
    "liquidity" TEXT NOT NULL DEFAULT 'NO_VENCIMENTO',
    "fgcCovered" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Investment" ("applicationDate", "createdAt", "fgcCovered", "id", "indexType", "institution", "liquidity", "maturityDate", "name", "notes", "principal", "rate", "type", "updatedAt") SELECT "applicationDate", "createdAt", "fgcCovered", "id", "indexType", "institution", "liquidity", "maturityDate", "name", "notes", "principal", "rate", "type", "updatedAt" FROM "Investment";
DROP TABLE "Investment";
ALTER TABLE "new_Investment" RENAME TO "Investment";
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "cdiRate" REAL NOT NULL DEFAULT 10.65,
    "selicRate" REAL NOT NULL DEFAULT 10.75,
    "ipcaRate" REAL NOT NULL DEFAULT 4.5,
    "usdToBrl" REAL NOT NULL DEFAULT 5.5,
    "eurToBrl" REAL NOT NULL DEFAULT 6.2,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("cdiRate", "id", "ipcaRate", "selicRate", "updatedAt") SELECT "cdiRate", "id", "ipcaRate", "selicRate", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
