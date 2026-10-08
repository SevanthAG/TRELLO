/*
  Warnings:

  - You are about to drop the column `boardId` on the `Issue` table. All the data in the column will be lost.
  - Added the required column `sectionId` to the `Issue` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_boardId_fkey";

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "boardId",
ADD COLUMN     "sectionId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
