/*
  Warnings:

  - You are about to drop the column `createdAt` on the `TimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TimeEntry` table. All the data in the column will be lost.
  - Made the column `jobId` on table `TimeEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."TimeEntry" DROP CONSTRAINT "TimeEntry_jobId_fkey";

-- AlterTable
ALTER TABLE "public"."TimeEntry" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "jobId" SET NOT NULL,
ALTER COLUMN "startedAt" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."TimeEntry" ADD CONSTRAINT "TimeEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
