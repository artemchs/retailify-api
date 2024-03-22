-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shiftId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "shiftId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
