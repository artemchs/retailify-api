/*
  Warnings:

  - You are about to drop the column `collectionId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CharacteristicToCollection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "_CharacteristicToCollection" DROP CONSTRAINT "_CharacteristicToCollection_A_fkey";

-- DropForeignKey
ALTER TABLE "_CharacteristicToCollection" DROP CONSTRAINT "_CharacteristicToCollection_B_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "collectionId";

-- DropTable
DROP TABLE "Collection";

-- DropTable
DROP TABLE "_CharacteristicToCollection";
