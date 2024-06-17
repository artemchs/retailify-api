/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Characteristic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[torgsoftId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[promId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rozetkaId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[torgsoftId]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[promId]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rozetkaId]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "promId" TEXT,
ADD COLUMN     "rozetkaId" TEXT,
ADD COLUMN     "torgsoftId" TEXT;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "promId" TEXT,
ADD COLUMN     "rozetkaId" TEXT,
ADD COLUMN     "torgsoftId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Characteristic_name_key" ON "Characteristic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_torgsoftId_key" ON "Product"("torgsoftId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_promId_key" ON "Product"("promId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_rozetkaId_key" ON "Product"("rozetkaId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_torgsoftId_key" ON "Variant"("torgsoftId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_promId_key" ON "Variant"("promId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_rozetkaId_key" ON "Variant"("rozetkaId");
