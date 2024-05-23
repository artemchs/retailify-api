/*
  Warnings:

  - You are about to drop the column `taxAdress` on the `SoleProprietorInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SoleProprietorInfo" DROP COLUMN "taxAdress",
ADD COLUMN     "taxAddress" TEXT;
