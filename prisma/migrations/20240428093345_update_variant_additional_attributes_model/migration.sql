/*
  Warnings:

  - The primary key for the `VariantAdditionalAttribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `VariantAdditionalAttribute` table. All the data in the column will be lost.
  - Made the column `variantId` on table `VariantAdditionalAttribute` required. This step will fail if there are existing NULL values in that column.
  - Made the column `additionalAttributeId` on table `VariantAdditionalAttribute` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "VariantAdditionalAttribute_variantId_additionalAttributeId_key";

-- AlterTable
ALTER TABLE "VariantAdditionalAttribute" DROP CONSTRAINT "VariantAdditionalAttribute_pkey",
DROP COLUMN "id",
ALTER COLUMN "variantId" SET NOT NULL,
ALTER COLUMN "additionalAttributeId" SET NOT NULL,
ADD CONSTRAINT "VariantAdditionalAttribute_pkey" PRIMARY KEY ("variantId", "additionalAttributeId");
