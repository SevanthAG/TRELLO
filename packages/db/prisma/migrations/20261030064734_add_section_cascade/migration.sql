-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_sectionId_fkey";

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
