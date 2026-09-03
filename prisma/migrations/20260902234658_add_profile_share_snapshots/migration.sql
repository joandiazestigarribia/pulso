-- CreateTable
CREATE TABLE "ProfileShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharerName" TEXT,
    "personaName" TEXT NOT NULL,
    "personaAssetFile" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "completedBattlesCount" INTEGER NOT NULL,
    "generatedFromVotes" INTEGER NOT NULL,
    "dominantGenres" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileShare_userId_createdAt_idx" ON "ProfileShare"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfileShare" ADD CONSTRAINT "ProfileShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
