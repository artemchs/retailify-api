-- DropForeignKey
ALTER TABLE "InventoryTransferItem" DROP CONSTRAINT "InventoryTransferItem_variantId_fkey";

-- AlterTable
ALTER TABLE "InventoryTransferItem" ALTER COLUMN "variantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
