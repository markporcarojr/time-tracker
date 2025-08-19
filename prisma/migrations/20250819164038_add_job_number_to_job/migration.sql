/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `runningSince` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `totalMilliseconds` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `TimeEntry` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `customerName` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."TimeEntry" DROP CONSTRAINT "TimeEntry_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TimeEntry" DROP CONSTRAINT "TimeEntry_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Job" DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "runningSince",
DROP COLUMN "totalMilliseconds",
DROP COLUMN "updatedAt",
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "jobNumber" INTEGER,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "stoppedAt" TIMESTAMP(3),
ADD COLUMN     "totalMs" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'PAUSED';

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "createdAt";

-- DropTable
DROP TABLE "public"."TimeEntry";
