-- AlterTable
ALTER TABLE "Summary" ADD COLUMN     "promptVersion" TEXT,
ADD COLUMN     "qualityScore" INTEGER,
ADD COLUMN     "qualityFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
