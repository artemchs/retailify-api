-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "customOperationId" TEXT;

-- CreateTable
CREATE TABLE "CustomFinancialOperation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CustomFinancialOperation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customOperationId_fkey" FOREIGN KEY ("customOperationId") REFERENCES "CustomFinancialOperation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
