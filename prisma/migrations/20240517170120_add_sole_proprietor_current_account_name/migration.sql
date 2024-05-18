/*
  Warnings:

  - Added the required column `name` to the `SoleProprietorCurrentAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SoleProprietorCurrentAccount" ADD COLUMN     "name" TEXT NOT NULL;
