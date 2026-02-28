-- CreateEnum
CREATE TYPE "BattleState" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "albumImage" TEXT NOT NULL,
    "previewUrl" TEXT,
    "eloScore" INTEGER NOT NULL DEFAULT 1500,
    "battlesCount" INTEGER NOT NULL DEFAULT 0,
    "bpm" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackAId" TEXT NOT NULL,
    "trackBId" TEXT NOT NULL,
    "winnerId" TEXT,
    "loserId" TEXT,
    "winnerEloChange" INTEGER,
    "loserEloChange" INTEGER,
    "status" "BattleState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT,
    "dominantGenre" TEXT,
    "genreVarietyScore" DOUBLE PRECISION,
    "averageEnergy" DOUBLE PRECISION,
    "averageValence" DOUBLE PRECISION,
    "averageDanceability" DOUBLE PRECISION,
    "decadeDistribution" JSONB,
    "generatedFromVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Battle_userId_status_createdAt_idx" ON "Battle"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Battle_trackAId_createdAt_idx" ON "Battle"("trackAId", "createdAt");

-- CreateIndex
CREATE INDEX "Battle_trackBId_createdAt_idx" ON "Battle"("trackBId", "createdAt");

-- CreateIndex
CREATE INDEX "Battle_status_createdAt_idx" ON "Battle"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MusicProfile_userId_key" ON "MusicProfile"("userId");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_trackAId_fkey" FOREIGN KEY ("trackAId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_trackBId_fkey" FOREIGN KEY ("trackBId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicProfile" ADD CONSTRAINT "MusicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

