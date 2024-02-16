/*
  Warnings:

  - The values [CASH_ON_DELIVERY,PAYMENT_IN_ADVANCE,PAYMENT_ON_REALIZATION] on the enum `SupplierInvoicePaymentTerm` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SupplierInvoicePaymentTerm_new" AS ENUM ('ON_DELIVERY', 'IN_ADVANCE', 'ON_REALIZATION');
ALTER TABLE "SupplierInvoice" ALTER COLUMN "paymentTerm" TYPE "SupplierInvoicePaymentTerm_new" USING ("paymentTerm"::text::"SupplierInvoicePaymentTerm_new");
ALTER TYPE "SupplierInvoicePaymentTerm" RENAME TO "SupplierInvoicePaymentTerm_old";
ALTER TYPE "SupplierInvoicePaymentTerm_new" RENAME TO "SupplierInvoicePaymentTerm";
DROP TYPE "SupplierInvoicePaymentTerm_old";
COMMIT;
