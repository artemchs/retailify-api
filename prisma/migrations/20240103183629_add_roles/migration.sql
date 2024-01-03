-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "SystemUser" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'EMPLOYEE';
