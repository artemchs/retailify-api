/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `SystemUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SystemUser" DROP COLUMN "isDeleted";
