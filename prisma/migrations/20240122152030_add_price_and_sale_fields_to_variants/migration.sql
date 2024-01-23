/*
  Warnings:

  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sale` on the `Product` table. All the data in the column will be lost.
  - Added the required column `price` to the `VariantToGoodsReceipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `VariantToWarehouse` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Product_title_price_isArchived_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price",
DROP COLUMN "sale";

-- AlterTable
ALTER TABLE "VariantToGoodsReceipt" ADD COLUMN     "price" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "sale" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "VariantToWarehouse" ADD COLUMN     "price" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "sale" DECIMAL(8,2);

-- CreateIndex
CREATE INDEX "Product_title_isArchived_idx" ON "Product"("title", "isArchived");
