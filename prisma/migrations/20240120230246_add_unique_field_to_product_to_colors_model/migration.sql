/*
  Warnings:

  - A unique constraint covering the columns `[productId,colorId]` on the table `ProductToColor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductToColor_productId_colorId_key" ON "ProductToColor"("productId", "colorId");
