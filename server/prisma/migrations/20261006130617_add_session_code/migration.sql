/*
  Warnings:

  - You are about to drop the column `token` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionCode]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionCode` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "token",
ADD COLUMN     "sessionCode" VARCHAR(8) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionCode_key" ON "Session"("sessionCode");
