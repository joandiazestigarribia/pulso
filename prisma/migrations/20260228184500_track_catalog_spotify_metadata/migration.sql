-- AlterTable
ALTER TABLE "Track"
ADD COLUMN "spotifyTrackId" TEXT,
ADD COLUMN "spotifyPopularity" INTEGER,
ADD COLUMN "spotifyExplicit" BOOLEAN,
ADD COLUMN "spotifyPreviewAvailable" BOOLEAN,
ADD COLUMN "energy" DOUBLE PRECISION,
ADD COLUMN "valence" DOUBLE PRECISION,
ADD COLUMN "danceability" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Track_spotifyTrackId_key" ON "Track"("spotifyTrackId");
