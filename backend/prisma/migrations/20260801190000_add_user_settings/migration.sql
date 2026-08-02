-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredProvider" TEXT,
ADD COLUMN     "preferredMode" TEXT NOT NULL DEFAULT 'quick',
ADD COLUMN     "preferredExportFormat" TEXT NOT NULL DEFAULT 'txt';
