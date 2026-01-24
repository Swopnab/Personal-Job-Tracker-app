-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "salary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Interested',
    "link" TEXT,
    "dateApplied" DATETIME,
    "notes" TEXT,
    "followUpDate" DATETIME,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("company", "createdAt", "dateApplied", "followUpDate", "id", "jobTitle", "link", "notes", "salary", "status", "tags", "updatedAt", "userId") SELECT "company", "createdAt", "dateApplied", "followUpDate", "id", "jobTitle", "link", "notes", "salary", "status", "tags", "updatedAt", "userId" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE INDEX "Application_userId_idx" ON "Application"("userId");
CREATE INDEX "Application_status_idx" ON "Application"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
