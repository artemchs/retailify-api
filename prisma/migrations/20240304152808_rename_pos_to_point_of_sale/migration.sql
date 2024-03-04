/*
  Warnings:

  - You are about to drop the `POS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CategoryGroupToPOS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CategoryToPOS` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_POSToProductTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_POSToSystemUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CategoryGroupToPOS" DROP CONSTRAINT "_CategoryGroupToPOS_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryGroupToPOS" DROP CONSTRAINT "_CategoryGroupToPOS_B_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToPOS" DROP CONSTRAINT "_CategoryToPOS_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToPOS" DROP CONSTRAINT "_CategoryToPOS_B_fkey";

-- DropForeignKey
ALTER TABLE "_POSToProductTag" DROP CONSTRAINT "_POSToProductTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_POSToProductTag" DROP CONSTRAINT "_POSToProductTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_POSToSystemUser" DROP CONSTRAINT "_POSToSystemUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_POSToSystemUser" DROP CONSTRAINT "_POSToSystemUser_B_fkey";

-- DropTable
DROP TABLE "POS";

-- DropTable
DROP TABLE "_CategoryGroupToPOS";

-- DropTable
DROP TABLE "_CategoryToPOS";

-- DropTable
DROP TABLE "_POSToProductTag";

-- DropTable
DROP TABLE "_POSToSystemUser";

-- CreateTable
CREATE TABLE "PointOfSale" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "PointOfSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryGroupToPointOfSale" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CategoryToPointOfSale" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PointOfSaleToSystemUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PointOfSaleToProductTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryGroupToPointOfSale_AB_unique" ON "_CategoryGroupToPointOfSale"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryGroupToPointOfSale_B_index" ON "_CategoryGroupToPointOfSale"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToPointOfSale_AB_unique" ON "_CategoryToPointOfSale"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToPointOfSale_B_index" ON "_CategoryToPointOfSale"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PointOfSaleToSystemUser_AB_unique" ON "_PointOfSaleToSystemUser"("A", "B");

-- CreateIndex
CREATE INDEX "_PointOfSaleToSystemUser_B_index" ON "_PointOfSaleToSystemUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PointOfSaleToProductTag_AB_unique" ON "_PointOfSaleToProductTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PointOfSaleToProductTag_B_index" ON "_PointOfSaleToProductTag"("B");

-- AddForeignKey
ALTER TABLE "_CategoryGroupToPointOfSale" ADD CONSTRAINT "_CategoryGroupToPointOfSale_A_fkey" FOREIGN KEY ("A") REFERENCES "CategoryGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryGroupToPointOfSale" ADD CONSTRAINT "_CategoryGroupToPointOfSale_B_fkey" FOREIGN KEY ("B") REFERENCES "PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPointOfSale" ADD CONSTRAINT "_CategoryToPointOfSale_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPointOfSale" ADD CONSTRAINT "_CategoryToPointOfSale_B_fkey" FOREIGN KEY ("B") REFERENCES "PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PointOfSaleToSystemUser" ADD CONSTRAINT "_PointOfSaleToSystemUser_A_fkey" FOREIGN KEY ("A") REFERENCES "PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PointOfSaleToSystemUser" ADD CONSTRAINT "_PointOfSaleToSystemUser_B_fkey" FOREIGN KEY ("B") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PointOfSaleToProductTag" ADD CONSTRAINT "_PointOfSaleToProductTag_A_fkey" FOREIGN KEY ("A") REFERENCES "PointOfSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PointOfSaleToProductTag" ADD CONSTRAINT "_PointOfSaleToProductTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
