/*
  Warnings:

  - You are about to drop the `AccountPayableToSupplierInvoice` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `accountsPayable` to the `SupplierInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AccountPayableToSupplierInvoice" DROP CONSTRAINT "AccountPayableToSupplierInvoice_invoiceId_fkey";

-- AlterTable
ALTER TABLE "SupplierInvoice" ADD COLUMN     "accountsPayable" DECIMAL(12,2) NOT NULL;

-- DropTable
DROP TABLE "AccountPayableToSupplierInvoice";
