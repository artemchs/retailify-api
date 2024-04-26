-- CreateTable
CREATE TABLE "AdditionalAttribute" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AdditionalAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantAdditionalAttribute" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "variantId" TEXT,
    "additionalAttributeId" TEXT,
    "value" TEXT NOT NULL,

    CONSTRAINT "VariantAdditionalAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdditionalAttribute_name_key" ON "AdditionalAttribute"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VariantAdditionalAttribute_variantId_additionalAttributeId_key" ON "VariantAdditionalAttribute"("variantId", "additionalAttributeId");

-- AddForeignKey
ALTER TABLE "VariantAdditionalAttribute" ADD CONSTRAINT "VariantAdditionalAttribute_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAdditionalAttribute" ADD CONSTRAINT "VariantAdditionalAttribute_additionalAttributeId_fkey" FOREIGN KEY ("additionalAttributeId") REFERENCES "AdditionalAttribute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
