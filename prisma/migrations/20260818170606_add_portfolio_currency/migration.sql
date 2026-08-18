-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PortfolioEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "institution" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "value" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PortfolioEntry" ("category", "createdAt", "id", "institution", "month", "updatedAt", "value", "year") SELECT "category", "createdAt", "id", "institution", "month", "updatedAt", "value", "year" FROM "PortfolioEntry";
DROP TABLE "PortfolioEntry";
ALTER TABLE "new_PortfolioEntry" RENAME TO "PortfolioEntry";
CREATE INDEX "PortfolioEntry_year_institution_category_idx" ON "PortfolioEntry"("year", "institution", "category");
CREATE UNIQUE INDEX "PortfolioEntry_year_month_institution_category_key" ON "PortfolioEntry"("year", "month", "institution", "category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
