-- CreateIndex
CREATE INDEX "Summary_userId_createdAt_idx" ON "Summary"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Summary_userId_mode_idx" ON "Summary"("userId", "mode");

-- CreateIndex
CREATE INDEX "Summary_userId_provider_idx" ON "Summary"("userId", "provider");
