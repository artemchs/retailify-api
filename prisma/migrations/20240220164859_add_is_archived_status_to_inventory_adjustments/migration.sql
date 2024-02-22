/*
  Warnings:

  - Added the required column `isArchived` to the `InventoryAdjustment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryAdjustment" ADD COLUMN     "isArchived" BOOLEAN NOT NULL;
