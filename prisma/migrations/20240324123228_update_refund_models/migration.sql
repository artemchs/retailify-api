/*
  Warnings:

  - Added the required column `amount` to the `Refund` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `RefundItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "amount" DECIMAL(8,2) NOT NULL;

-- AlterTable
ALTER TABLE "RefundItem" ADD COLUMN     "amount" DECIMAL(8,2) NOT NULL;
