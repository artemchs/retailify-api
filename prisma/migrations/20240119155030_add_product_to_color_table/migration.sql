/*
  Warnings:

  - You are about to drop the `_ColorToProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ColorToProduct" DROP CONSTRAINT "_ColorToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_ColorToProduct" DROP CONSTRAINT "_ColorToProduct_B_fkey";

-- DropTable
DROP TABLE "_ColorToProduct";

-- CreateTable
CREATE TABLE "ProductToColor" (
    "productId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "ProductToColor_pkey" PRIMARY KEY ("productId","colorId")
);

-- AddForeignKey
ALTER TABLE "ProductToColor" ADD CONSTRAINT "ProductToColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductToColor" ADD CONSTRAINT "ProductToColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
