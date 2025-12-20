-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonitoringTarget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL DEFAULT 'general',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MonitoringTarget" ("createdAt", "id", "type", "value") SELECT "createdAt", "id", "type", "value" FROM "MonitoringTarget";
DROP TABLE "MonitoringTarget";
ALTER TABLE "new_MonitoringTarget" RENAME TO "MonitoringTarget";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
