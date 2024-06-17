-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('ERROR', 'SUCCESS', 'PENDING', 'IDLE');

-- CreateEnum
CREATE TYPE "ImportFileType" AS ENUM ('EXCEL', 'CSV');

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importSourceId" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'IDLE',
    "comment" TEXT,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportFile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" TEXT NOT NULL,
    "type" "ImportFileType" NOT NULL,
    "importId" TEXT NOT NULL,

    CONSTRAINT "ImportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "schema" JSONB NOT NULL,

    CONSTRAINT "ImportSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportFile_key_key" ON "ImportFile"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ImportFile_importId_key" ON "ImportFile"("importId");

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_importSourceId_fkey" FOREIGN KEY ("importSourceId") REFERENCES "ImportSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportFile" ADD CONSTRAINT "ImportFile_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;
