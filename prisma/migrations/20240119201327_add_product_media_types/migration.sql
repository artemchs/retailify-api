/*
  Warnings:

  - Added the required column `type` to the `ProductMedia` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "ProductMedia" ADD COLUMN     "type" "ProductMediaType" NOT NULL;
