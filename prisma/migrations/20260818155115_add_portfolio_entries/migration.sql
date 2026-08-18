-- CreateTable
CREATE TABLE "PortfolioEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "institution" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PortfolioEntry_year_institution_category_idx" ON "PortfolioEntry"("year", "institution", "category");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioEntry_year_month_institution_category_key" ON "PortfolioEntry"("year", "month", "institution", "category");
