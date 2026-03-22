-- Drop legacy Spotify-specific metadata after Deezer-first migration.
DROP INDEX IF EXISTS "Track_spotifyTrackId_key";

ALTER TABLE "Track"
DROP COLUMN IF EXISTS "spotifyTrackId",
DROP COLUMN IF EXISTS "spotifyPopularity",
DROP COLUMN IF EXISTS "spotifyExplicit",
DROP COLUMN IF EXISTS "spotifyPreviewAvailable";
