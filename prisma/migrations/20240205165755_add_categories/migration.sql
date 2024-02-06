/*
  Warnings:

  - Added the required column `gender` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `season` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductSeason" AS ENUM ('WINTER', 'SPRING_FALL', 'SUMMER', 'ALL_SEASON');

-- CreateEnum
CREATE TYPE "ProductGender" AS ENUM ('MALE', 'FEMALE', 'UNISEX');

-- AlterTable
ALTER TABLE "Characteristic" ADD COLUMN     "categoryGroupId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "gender" "ProductGender" NOT NULL,
ADD COLUMN     "season" "ProductSeason" NOT NULL;

-- CreateTable
CREATE TABLE "CategoryGroup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CategoryGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Characteristic" ADD CONSTRAINT "Characteristic_categoryGroupId_fkey" FOREIGN KEY ("categoryGroupId") REFERENCES "CategoryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CategoryGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
