-- CreateTable
CREATE TABLE "WorkflowSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workflowType" TEXT NOT NULL,
    "relevancyPrompt" TEXT NOT NULL,
    "commentPrompt" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowSettings_workflowType_key" ON "WorkflowSettings"("workflowType");
