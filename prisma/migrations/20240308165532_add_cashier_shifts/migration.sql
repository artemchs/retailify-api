-- CreateTable
CREATE TABLE "CashierShift" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cashierId" TEXT,
    "pointOfSaleId" TEXT,
    "startingCashBalance" DECIMAL(8,2) NOT NULL,
    "endingCashBalance" DECIMAL(8,2) NOT NULL,
    "isOpened" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CashierShift_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_pointOfSaleId_fkey" FOREIGN KEY ("pointOfSaleId") REFERENCES "PointOfSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
