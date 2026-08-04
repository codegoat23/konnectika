-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "creatorsJoined" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requirements" TEXT[],
ADD COLUMN     "tags" TEXT[];
