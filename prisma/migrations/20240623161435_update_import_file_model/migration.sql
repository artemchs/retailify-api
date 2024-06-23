/*
  Warnings:

  - Added the required column `type` to the `Import` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('PRODUCTS');

-- AlterTable
ALTER TABLE "Import" ADD COLUMN     "type" "ImportType" NOT NULL;
