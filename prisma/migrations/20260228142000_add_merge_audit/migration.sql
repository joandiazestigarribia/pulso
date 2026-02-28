-- CreateEnum
CREATE TYPE "MergeAuditStatus" AS ENUM ('MERGED', 'NOOP', 'INVALID_SOURCE');

-- CreateTable
CREATE TABLE "MergeAudit" (
    "id" TEXT NOT NULL,
    "sourceAnonymousId" TEXT,
    "targetUserId" TEXT NOT NULL,
    "movedBattles" INTEGER NOT NULL DEFAULT 0,
    "status" "MergeAuditStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MergeAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MergeAudit_targetUserId_createdAt_idx" ON "MergeAudit"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "MergeAudit_sourceAnonymousId_createdAt_idx" ON "MergeAudit"("sourceAnonymousId", "createdAt");

-- AddForeignKey
ALTER TABLE "MergeAudit" ADD CONSTRAINT "MergeAudit_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

