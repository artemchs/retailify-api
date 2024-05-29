-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "adminId" TEXT;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
