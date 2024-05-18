/*
  Warnings:

  - Added the required column `iban` to the `SoleProprietorCurrentAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SoleProprietorCurrentAccount" ADD COLUMN     "iban" TEXT NOT NULL;
