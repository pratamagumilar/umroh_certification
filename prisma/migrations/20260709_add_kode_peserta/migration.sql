-- AlterTable
ALTER TABLE "User" ADD COLUMN "kodePeserta" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_kodePeserta_key" ON "User"("kodePeserta");

-- CreateIndex
CREATE INDEX "User_kodePeserta_idx" ON "User"("kodePeserta");