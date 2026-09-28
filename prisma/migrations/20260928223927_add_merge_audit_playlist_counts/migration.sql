-- AlterTable
ALTER TABLE "MergeAudit" ADD COLUMN     "movedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "movedPlaylists" INTEGER NOT NULL DEFAULT 0;
