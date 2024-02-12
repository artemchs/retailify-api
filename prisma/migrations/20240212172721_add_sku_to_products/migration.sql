/*
  Warnings:

  - You are about to drop the column `sku` on the `Variant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sku` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Variant_productId_barcode_sku_idx";

-- DropIndex
DROP INDEX "Variant_sku_key";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sku" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "sku";

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Variant_productId_barcode_idx" ON "Variant"("productId", "barcode");
