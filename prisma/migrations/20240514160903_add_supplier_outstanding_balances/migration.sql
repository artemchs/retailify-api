/*
  Warnings:

  - Added the required column `outstandingBalance` to the `SupplierInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "totalOutstandingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SupplierInvoice" ADD COLUMN     "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "outstandingBalance" DECIMAL(12,2) NOT NULL;
