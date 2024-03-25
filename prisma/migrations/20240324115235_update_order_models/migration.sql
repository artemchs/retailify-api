/*
  Warnings:

  - You are about to drop the column `itemDiscountTotal` on the `Order` table. All the data in the column will be lost.
  - Added the required column `totalWithDiscount` to the `CustomerOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalWithDiscount` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CustomerOrderItem" ADD COLUMN     "totalWithDiscount" DECIMAL(8,2) NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "itemDiscountTotal",
ADD COLUMN     "totalWithDiscount" DECIMAL(8,2) NOT NULL;
