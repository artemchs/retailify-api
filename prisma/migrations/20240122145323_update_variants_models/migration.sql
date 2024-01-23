/*
  Warnings:

  - You are about to drop the column `totalStock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `VariantToGoodsReceipt` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `VariantToWarehouse` table. All the data in the column will be lost.
  - Added the required column `totalReceivedQuantity` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalWarehouseQuantity` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalReceivedQuantity` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalWarehouseQuantity` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedQuantity` to the `VariantToGoodsReceipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseQuantity` to the `VariantToWarehouse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "totalStock",
ADD COLUMN     "totalReceivedQuantity" INTEGER NOT NULL,
ADD COLUMN     "totalWarehouseQuantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "totalReceivedQuantity" INTEGER NOT NULL,
ADD COLUMN     "totalWarehouseQuantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "VariantToGoodsReceipt" DROP COLUMN "quantity",
ADD COLUMN     "receivedQuantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "VariantToWarehouse" DROP COLUMN "quantity",
ADD COLUMN     "warehouseQuantity" INTEGER NOT NULL;
