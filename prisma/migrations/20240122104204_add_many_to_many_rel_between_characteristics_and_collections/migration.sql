/*
  Warnings:

  - You are about to drop the column `collectionId` on the `Characteristic` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Characteristic" DROP CONSTRAINT "Characteristic_collectionId_fkey";

-- AlterTable
ALTER TABLE "Characteristic" DROP COLUMN "collectionId";

-- CreateTable
CREATE TABLE "_CharacteristicToCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CharacteristicToCollection_AB_unique" ON "_CharacteristicToCollection"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacteristicToCollection_B_index" ON "_CharacteristicToCollection"("B");

-- AddForeignKey
ALTER TABLE "_CharacteristicToCollection" ADD CONSTRAINT "_CharacteristicToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "Characteristic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacteristicToCollection" ADD CONSTRAINT "_CharacteristicToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
