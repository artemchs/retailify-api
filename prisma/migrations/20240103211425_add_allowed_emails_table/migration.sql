/*
  Warnings:

  - You are about to drop the column `role` on the `SystemUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SystemUser" DROP COLUMN "role";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "AllowedEmail" (
    "email" TEXT NOT NULL,

    CONSTRAINT "AllowedEmail_pkey" PRIMARY KEY ("email")
);
