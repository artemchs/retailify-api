/*
  Warnings:

  - The primary key for the `SoleProprietorInfo` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "SoleProprietorCurrentAccount" DROP CONSTRAINT "SoleProprietorCurrentAccount_soleProprietorInfoId_fkey";

-- DropForeignKey
ALTER TABLE "SystemUser" DROP CONSTRAINT "SystemUser_soleProprietorInfoId_fkey";

-- AlterTable
ALTER TABLE "SoleProprietorCurrentAccount" ALTER COLUMN "soleProprietorInfoId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SoleProprietorInfo" DROP CONSTRAINT "SoleProprietorInfo_pkey",
ADD COLUMN     "tin" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "SoleProprietorInfo_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SystemUser" ALTER COLUMN "soleProprietorInfoId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "SystemUser" ADD CONSTRAINT "SystemUser_soleProprietorInfoId_fkey" FOREIGN KEY ("soleProprietorInfoId") REFERENCES "SoleProprietorInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoleProprietorCurrentAccount" ADD CONSTRAINT "SoleProprietorCurrentAccount_soleProprietorInfoId_fkey" FOREIGN KEY ("soleProprietorInfoId") REFERENCES "SoleProprietorInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
