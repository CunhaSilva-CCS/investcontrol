-- CreateTable
CREATE TABLE "InvestmentMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestmentMovement_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InvestmentMovement_investmentId_date_idx" ON "InvestmentMovement"("investmentId", "date");
