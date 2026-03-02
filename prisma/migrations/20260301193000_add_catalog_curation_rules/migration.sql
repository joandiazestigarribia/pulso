-- CreateEnum
CREATE TYPE "CatalogCurationRuleType" AS ENUM ('ARTIST');

-- CreateTable
CREATE TABLE "CatalogCurationRule" (
    "id" TEXT NOT NULL,
    "type" "CatalogCurationRuleType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCurationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogCurationRule_type_isActive_idx" ON "CatalogCurationRule"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCurationRule_type_pattern_key" ON "CatalogCurationRule"("type", "pattern");
