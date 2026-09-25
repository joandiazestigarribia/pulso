-- CreateEnum
CREATE TYPE "PlaylistStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PlaylistStatus" NOT NULL DEFAULT 'DRAFT',
    "roundCount" INTEGER NOT NULL DEFAULT 15,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuessRound" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "roundIndex" INTEGER NOT NULL,
    "correctTrackId" TEXT NOT NULL,
    "decoyTrackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuessRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistAttempt" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "playerUserId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "roundIndex" INTEGER NOT NULL,
    "chosenTrackId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,

    CONSTRAINT "PlaylistAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Playlist_ownerUserId_createdAt_idx" ON "Playlist"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PlaylistTrack_playlistId_position_idx" ON "PlaylistTrack"("playlistId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_playlistId_trackId_key" ON "PlaylistTrack"("playlistId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "GuessRound_playlistId_roundIndex_key" ON "GuessRound"("playlistId", "roundIndex");

-- CreateIndex
CREATE INDEX "PlaylistAttempt_playlistId_score_idx" ON "PlaylistAttempt"("playlistId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistAttempt_playlistId_playerUserId_key" ON "PlaylistAttempt"("playlistId", "playerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistAttemptAnswer_attemptId_roundIndex_key" ON "PlaylistAttemptAnswer"("attemptId", "roundIndex");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuessRound" ADD CONSTRAINT "GuessRound_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuessRound" ADD CONSTRAINT "GuessRound_correctTrackId_fkey" FOREIGN KEY ("correctTrackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuessRound" ADD CONSTRAINT "GuessRound_decoyTrackId_fkey" FOREIGN KEY ("decoyTrackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistAttempt" ADD CONSTRAINT "PlaylistAttempt_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistAttempt" ADD CONSTRAINT "PlaylistAttempt_playerUserId_fkey" FOREIGN KEY ("playerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistAttemptAnswer" ADD CONSTRAINT "PlaylistAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PlaylistAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
