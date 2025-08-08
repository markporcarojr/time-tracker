-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "runningSince" TIMESTAMP(3),
ADD COLUMN     "totalMinutes" INTEGER NOT NULL DEFAULT 0;
