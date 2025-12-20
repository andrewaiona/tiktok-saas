-- AlterTable
ALTER TABLE "ScrapedVideo" ADD COLUMN "analysisReason" TEXT;
ALTER TABLE "ScrapedVideo" ADD COLUMN "playUrl" TEXT;

-- CreateTable
CREATE TABLE "BrandSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productName" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "persona" TEXT NOT NULL DEFAULT 'Professional',
    "updatedAt" DATETIME NOT NULL
);
