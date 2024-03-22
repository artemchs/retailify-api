-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_shiftId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "shiftId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
