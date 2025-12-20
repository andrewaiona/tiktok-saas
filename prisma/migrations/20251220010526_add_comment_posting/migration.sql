-- AlterTable
ALTER TABLE "BrandSettings" ADD COLUMN "ugcAccountId" TEXT;

-- AlterTable
ALTER TABLE "ScrapedVideo" ADD COLUMN "commentId" TEXT;
ALTER TABLE "ScrapedVideo" ADD COLUMN "commentPosted" BOOLEAN DEFAULT false;
ALTER TABLE "ScrapedVideo" ADD COLUMN "commentStatus" TEXT;
ALTER TABLE "ScrapedVideo" ADD COLUMN "commentUrl" TEXT;
