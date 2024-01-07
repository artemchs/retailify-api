/*
  Warnings:

  - The values [EMPLOYEE] on the enum `SystemUserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SystemUserRole_new" AS ENUM ('ADMIN', 'CASHIER');
ALTER TABLE "SystemUser" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "SystemUser" ALTER COLUMN "role" TYPE "SystemUserRole_new" USING ("role"::text::"SystemUserRole_new");
ALTER TYPE "SystemUserRole" RENAME TO "SystemUserRole_old";
ALTER TYPE "SystemUserRole_new" RENAME TO "SystemUserRole";
DROP TYPE "SystemUserRole_old";
ALTER TABLE "SystemUser" ALTER COLUMN "role" SET DEFAULT 'CASHIER';
COMMIT;

-- AlterTable
ALTER TABLE "SystemUser" ALTER COLUMN "role" SET DEFAULT 'CASHIER';
