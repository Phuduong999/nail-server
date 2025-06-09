-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NailArtist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "description" TEXT,
    "images" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NailArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NailArtist" ("address", "createdAt", "description", "id", "images", "latitude", "longitude", "name", "phone", "status", "updatedAt", "userId") SELECT "address", "createdAt", "description", "id", "images", "latitude", "longitude", "name", "phone", "status", "updatedAt", "userId" FROM "NailArtist";
DROP TABLE "NailArtist";
ALTER TABLE "new_NailArtist" RENAME TO "NailArtist";
CREATE UNIQUE INDEX "NailArtist_userId_key" ON "NailArtist"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
