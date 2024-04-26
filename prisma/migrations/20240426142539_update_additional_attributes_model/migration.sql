-- DropForeignKey
ALTER TABLE "VariantAdditionalAttribute" DROP CONSTRAINT "VariantAdditionalAttribute_additionalAttributeId_fkey";

-- DropForeignKey
ALTER TABLE "VariantAdditionalAttribute" DROP CONSTRAINT "VariantAdditionalAttribute_variantId_fkey";

-- AddForeignKey
ALTER TABLE "VariantAdditionalAttribute" ADD CONSTRAINT "VariantAdditionalAttribute_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAdditionalAttribute" ADD CONSTRAINT "VariantAdditionalAttribute_additionalAttributeId_fkey" FOREIGN KEY ("additionalAttributeId") REFERENCES "AdditionalAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
