/*
  Warnings:

  - A unique constraint covering the columns `[companyName]` on the table `BusinessProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_companyName_key" ON "BusinessProfile"("companyName");
