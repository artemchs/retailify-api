/*
  Warnings:

  - Added the required column `name` to the `CashierShift` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CashierShift" ADD COLUMN     "name" TEXT NOT NULL;
