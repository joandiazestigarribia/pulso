-- CreateEnum
CREATE TYPE "ConversionEventName" AS ENUM (
  'battle_started',
  'vote_submitted',
  'profile_teaser_viewed',
  'profile_unlock_reached',
  'auth_prompt_shown',
  'auth_completed',
  'merge_completed',
  'export_started',
  'export_completed'
);

-- CreateTable
CREATE TABLE "ConversionEvent" (
  "id" TEXT NOT NULL,
  "eventName" "ConversionEventName" NOT NULL,
  "userId" TEXT,
  "anonymousId" TEXT,
  "battleId" TEXT,
  "variant" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversionEvent_eventName_createdAt_idx" ON "ConversionEvent"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "ConversionEvent_userId_createdAt_idx" ON "ConversionEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ConversionEvent_anonymousId_createdAt_idx" ON "ConversionEvent"("anonymousId", "createdAt");

-- AddForeignKey
ALTER TABLE "ConversionEvent"
ADD CONSTRAINT "ConversionEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
