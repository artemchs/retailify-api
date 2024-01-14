/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `Supplier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "isDeleted",
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
