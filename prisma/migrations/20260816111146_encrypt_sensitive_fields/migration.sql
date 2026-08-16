-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "type" TEXT NOT NULL,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
