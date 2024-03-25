/*
  Warnings:

  - You are about to drop the column `totalWithDiscount` on the `CustomerOrderItem` table. All the data in the column will be lost.
  - Added the required column `pricePerItemWithDiscount` to the `CustomerOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerOrderItem" DROP COLUMN "totalWithDiscount",
ADD COLUMN     "pricePerItemWithDiscount" DECIMAL(8,2) NOT NULL;
