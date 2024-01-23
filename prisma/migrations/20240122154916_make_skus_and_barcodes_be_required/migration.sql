/*
  Warnings:

  - Made the column `sku` on table `Variant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `barcode` on table `Variant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Variant" ALTER COLUMN "sku" SET NOT NULL,
ALTER COLUMN "barcode" SET NOT NULL;
