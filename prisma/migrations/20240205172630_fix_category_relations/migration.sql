/*
  Warnings:

  - You are about to drop the column `categoryGroupId` on the `Characteristic` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Characteristic" DROP CONSTRAINT "Characteristic_categoryGroupId_fkey";

-- AlterTable
ALTER TABLE "Characteristic" DROP COLUMN "categoryGroupId";

-- CreateTable
CREATE TABLE "_CategoryGroupToCharacteristic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CategoryToCharacteristic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryGroupToCharacteristic_AB_unique" ON "_CategoryGroupToCharacteristic"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryGroupToCharacteristic_B_index" ON "_CategoryGroupToCharacteristic"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToCharacteristic_AB_unique" ON "_CategoryToCharacteristic"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToCharacteristic_B_index" ON "_CategoryToCharacteristic"("B");

-- AddForeignKey
ALTER TABLE "_CategoryGroupToCharacteristic" ADD CONSTRAINT "_CategoryGroupToCharacteristic_A_fkey" FOREIGN KEY ("A") REFERENCES "CategoryGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryGroupToCharacteristic" ADD CONSTRAINT "_CategoryGroupToCharacteristic_B_fkey" FOREIGN KEY ("B") REFERENCES "Characteristic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToCharacteristic" ADD CONSTRAINT "_CategoryToCharacteristic_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToCharacteristic" ADD CONSTRAINT "_CategoryToCharacteristic_B_fkey" FOREIGN KEY ("B") REFERENCES "Characteristic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
