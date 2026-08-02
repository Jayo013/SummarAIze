-- CreateTable
CREATE TABLE "SharedSummary" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "summaryId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedSummary_token_key" ON "SharedSummary"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SharedSummary_summaryId_key" ON "SharedSummary"("summaryId");

-- AddForeignKey
ALTER TABLE "SharedSummary" ADD CONSTRAINT "SharedSummary_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "Summary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
