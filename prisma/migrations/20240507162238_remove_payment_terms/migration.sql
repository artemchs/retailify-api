/*
  Warnings:

  - You are about to drop the column `paymentTerm` on the `SupplierInvoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SupplierInvoice" DROP COLUMN "paymentTerm";

-- DropEnum
DROP TYPE "SupplierInvoicePaymentTerm";
