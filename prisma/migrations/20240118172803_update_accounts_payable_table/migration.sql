/*
  Warnings:

  - You are about to drop the `AccountPayable` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountPayable" DROP CONSTRAINT "AccountPayable_goodsReceiptId_fkey";

-- DropForeignKey
ALTER TABLE "AccountPayable" DROP CONSTRAINT "AccountPayable_invoiceId_fkey";

-- DropTable
DROP TABLE "AccountPayable";

-- CreateTable
CREATE TABLE "AccountPayableToSupplierInvoice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "AccountPayableToSupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountPayableToSupplierInvoice_invoiceId_key" ON "AccountPayableToSupplierInvoice"("invoiceId");

-- AddForeignKey
ALTER TABLE "AccountPayableToSupplierInvoice" ADD CONSTRAINT "AccountPayableToSupplierInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
