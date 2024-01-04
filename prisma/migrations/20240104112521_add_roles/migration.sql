-- CreateEnum
CREATE TYPE "SystemUserRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "SystemUser" ADD COLUMN     "role" "SystemUserRole" NOT NULL DEFAULT 'EMPLOYEE';
