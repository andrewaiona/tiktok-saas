-- CreateTable
CREATE TABLE "ScrapedVideo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tiktokId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "diggCount" INTEGER NOT NULL,
    "commentCount" INTEGER NOT NULL,
    "playCount" INTEGER NOT NULL,
    "shareCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRelevant" BOOLEAN,
    "relevanceScore" REAL,
    "generatedComment" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceValue" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedVideo_tiktokId_key" ON "ScrapedVideo"("tiktokId");
