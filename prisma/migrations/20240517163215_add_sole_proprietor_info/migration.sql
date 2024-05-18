/*
  Warnings:

  - A unique constraint covering the columns `[soleProprietorInfoId]` on the table `SystemUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SystemUser" ADD COLUMN     "soleProprietorInfoId" INTEGER;

-- CreateTable
CREATE TABLE "SoleProprietorInfo" (
    "id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoleProprietorInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoleProprietorCurrentAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soleProprietorInfoId" INTEGER,

    CONSTRAINT "SoleProprietorCurrentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_soleProprietorInfoId_key" ON "SystemUser"("soleProprietorInfoId");

-- AddForeignKey
ALTER TABLE "SystemUser" ADD CONSTRAINT "SystemUser_soleProprietorInfoId_fkey" FOREIGN KEY ("soleProprietorInfoId") REFERENCES "SoleProprietorInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoleProprietorCurrentAccount" ADD CONSTRAINT "SoleProprietorCurrentAccount_soleProprietorInfoId_fkey" FOREIGN KEY ("soleProprietorInfoId") REFERENCES "SoleProprietorInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
