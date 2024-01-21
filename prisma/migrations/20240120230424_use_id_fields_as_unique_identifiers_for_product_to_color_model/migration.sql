/*
  Warnings:

  - The primary key for the `ProductToColor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ProductToColor` table. All the data in the column will be lost.
  - Made the column `productId` on table `ProductToColor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `colorId` on table `ProductToColor` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProductToColor" DROP CONSTRAINT "ProductToColor_colorId_fkey";

-- DropForeignKey
ALTER TABLE "ProductToColor" DROP CONSTRAINT "ProductToColor_productId_fkey";

-- DropIndex
DROP INDEX "ProductToColor_productId_colorId_key";

-- AlterTable
ALTER TABLE "ProductToColor" DROP CONSTRAINT "ProductToColor_pkey",
DROP COLUMN "id",
ALTER COLUMN "productId" SET NOT NULL,
ALTER COLUMN "colorId" SET NOT NULL,
ADD CONSTRAINT "ProductToColor_pkey" PRIMARY KEY ("productId", "colorId");

-- AddForeignKey
ALTER TABLE "ProductToColor" ADD CONSTRAINT "ProductToColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductToColor" ADD CONSTRAINT "ProductToColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
