/*
  Warnings:

  - Added the required column `name` to the `GoodsReceipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GoodsReceipt" ADD COLUMN     "name" TEXT NOT NULL;
