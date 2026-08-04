/*
  Warnings:

  - The values [INSTAGRAM,TIKTOK,FACEBOOK,YOUTUBE,X] on the enum `Platform` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Platform_new" AS ENUM ('instagram', 'tiktok', 'facebook', 'youtube', 'x');
ALTER TABLE "Campaign" ALTER COLUMN "platforms" TYPE "Platform_new"[] USING ("platforms"::text::"Platform_new"[]);
ALTER TYPE "Platform" RENAME TO "Platform_old";
ALTER TYPE "Platform_new" RENAME TO "Platform";
DROP TYPE "public"."Platform_old";
COMMIT;
