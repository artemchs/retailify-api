-- DropForeignKey
ALTER TABLE "ProductToColor" DROP CONSTRAINT "ProductToColor_colorId_fkey";

-- DropForeignKey
ALTER TABLE "ProductToColor" DROP CONSTRAINT "ProductToColor_productId_fkey";

-- DropIndex
DROP INDEX "Variant_productId_idx";

-- CreateTable
CREATE TABLE "Characteristic" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Characteristic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacteristicValue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value" TEXT NOT NULL,
    "characteristicId" TEXT,

    CONSTRAINT "CharacteristicValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CharacteristicValueToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Characteristic_name_idx" ON "Characteristic"("name");

-- CreateIndex
CREATE INDEX "CharacteristicValue_characteristicId_idx" ON "CharacteristicValue"("characteristicId");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacteristicValueToProduct_AB_unique" ON "_CharacteristicValueToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacteristicValueToProduct_B_index" ON "_CharacteristicValueToProduct"("B");

-- CreateIndex
CREATE INDEX "Product_title_price_isArchived_idx" ON "Product"("title", "price", "isArchived");

-- CreateIndex
CREATE INDEX "ProductToColor_productId_colorId_idx" ON "ProductToColor"("productId", "colorId");

-- CreateIndex
CREATE INDEX "Variant_productId_barcode_sku_idx" ON "Variant"("productId", "barcode", "sku");

-- AddForeignKey
ALTER TABLE "ProductToColor" ADD CONSTRAINT "ProductToColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductToColor" ADD CONSTRAINT "ProductToColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacteristicValue" ADD CONSTRAINT "CharacteristicValue_characteristicId_fkey" FOREIGN KEY ("characteristicId") REFERENCES "Characteristic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacteristicValueToProduct" ADD CONSTRAINT "_CharacteristicValueToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "CharacteristicValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacteristicValueToProduct" ADD CONSTRAINT "_CharacteristicValueToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
