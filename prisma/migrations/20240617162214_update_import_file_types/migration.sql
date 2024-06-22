/*
  Warnings:

  - The values [EXCEL] on the enum `ImportFileType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ImportFileType_new" AS ENUM ('XLSX', 'XLS', 'CSV', 'OTHER');
ALTER TABLE "ImportFile" ALTER COLUMN "type" TYPE "ImportFileType_new" USING ("type"::text::"ImportFileType_new");
ALTER TYPE "ImportFileType" RENAME TO "ImportFileType_old";
ALTER TYPE "ImportFileType_new" RENAME TO "ImportFileType";
DROP TYPE "ImportFileType_old";
COMMIT;
