/*
  Warnings:

  - You are about to drop the column `totalMinutes` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Job" DROP COLUMN "totalMinutes",
ADD COLUMN     "totalMilliseconds" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."TimeEntry" ADD COLUMN     "duration" INTEGER;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- CreateIndex
CREATE INDEX "Job_userId_idx" ON "public"."Job"("userId");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_jobId_idx" ON "public"."TimeEntry"("userId", "jobId");

-- CreateIndex
CREATE INDEX "TimeEntry_jobId_startedAt_idx" ON "public"."TimeEntry"("jobId", "startedAt");
