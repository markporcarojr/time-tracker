/*
  Warnings:

  - You are about to drop the `TimeSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DONE');

-- DropForeignKey
ALTER TABLE "public"."TimeSession" DROP CONSTRAINT "TimeSession_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TimeSession" DROP CONSTRAINT "TimeSession_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "status" "public"."JobStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "public"."TimeSession";

-- CreateTable
CREATE TABLE "public"."TimeEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "jobId" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "manualMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeEntry" ADD CONSTRAINT "TimeEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
