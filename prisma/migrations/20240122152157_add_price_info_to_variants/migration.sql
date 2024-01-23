/*
  Warnings:

  - You are about to drop the column `price` on the `VariantToGoodsReceipt` table. All the data in the column will be lost.
  - You are about to drop the column `sale` on the `VariantToGoodsReceipt` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `VariantToWarehouse` table. All the data in the column will be lost.
  - You are about to drop the column `sale` on the `VariantToWarehouse` table. All the data in the column will be lost.
  - Added the required column `price` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "price" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "sale" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "VariantToGoodsReceipt" DROP COLUMN "price",
DROP COLUMN "sale";

-- AlterTable
ALTER TABLE "VariantToWarehouse" DROP COLUMN "price",
DROP COLUMN "sale";
