/*
  Warnings:

  - Added the required column `year` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "year" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "year" TEXT;
