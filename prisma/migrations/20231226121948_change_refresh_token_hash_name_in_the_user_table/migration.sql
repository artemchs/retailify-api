/*
  Warnings:

  - You are about to drop the column `hashedRefreshToken` on the `SystemUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SystemUser" DROP COLUMN "hashedRefreshToken",
ADD COLUMN     "rtHash" TEXT;
