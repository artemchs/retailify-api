/*
  Warnings:

  - The primary key for the `ProductToColor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `ProductToColor` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "ProductToColor" DROP CONSTRAINT "ProductToColor_colorId_fkey";

-- DropForeignKey
ALTER TABLE "ProductToColor" DROP CONSTRAINT "ProductToColor_productId_fkey";

-- AlterTable
ALTER TABLE "ProductToColor" DROP CONSTRAINT "ProductToColor_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "colorId" DROP NOT NULL,
ADD CONSTRAINT "ProductToColor_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "ProductToColor" ADD CONSTRAINT "ProductToColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductToColor" ADD CONSTRAINT "ProductToColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;
