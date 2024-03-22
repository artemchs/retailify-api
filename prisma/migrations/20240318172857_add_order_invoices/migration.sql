/*
  Warnings:

  - You are about to drop the column `cardAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cashAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderInvoiceId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_transactionId_fkey";

-- DropIndex
DROP INDEX "Order_transactionId_key";

-- AlterTable
ALTER TABLE "CustomerOrderItem" ADD COLUMN     "customDiscount" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "cardAmount",
DROP COLUMN "cashAmount",
DROP COLUMN "paymentMethod",
DROP COLUMN "transactionId",
ADD COLUMN     "customBulkDiscount" DECIMAL(8,2),
ADD COLUMN     "orderInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "orderInvoiceId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "OrderInvoice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalCashAmount" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "totalCardAmount" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "paymentMethod" "OrderPaymentMethod" NOT NULL,

    CONSTRAINT "OrderInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderInvoiceId_key" ON "Order"("orderInvoiceId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_orderInvoiceId_fkey" FOREIGN KEY ("orderInvoiceId") REFERENCES "OrderInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderInvoiceId_fkey" FOREIGN KEY ("orderInvoiceId") REFERENCES "OrderInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
