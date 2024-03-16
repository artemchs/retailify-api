/*
  Warnings:

  - Added the required column `shiftId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'CASH_REGISTER_DEPOSIT';
ALTER TYPE "TransactionType" ADD VALUE 'CASH_REGISTER_WITHDRAWAL';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "shiftId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
