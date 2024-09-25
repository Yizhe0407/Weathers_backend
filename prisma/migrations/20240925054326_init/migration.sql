-- DropForeignKey
ALTER TABLE "County" DROP CONSTRAINT "County_county_fkey";

-- AlterTable
ALTER TABLE "County" ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "County" ADD CONSTRAINT "County_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
