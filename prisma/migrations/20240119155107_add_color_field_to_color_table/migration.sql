/*
  Warnings:

  - Added the required column `color` to the `Color` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Color" ADD COLUMN     "color" TEXT NOT NULL;
