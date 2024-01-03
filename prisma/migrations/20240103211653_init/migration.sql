/*
  Warnings:

  - You are about to drop the `AllowedEmail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "AllowedEmail";

-- CreateTable
CREATE TABLE "AllowedSystemUserEmail" (
    "email" TEXT NOT NULL,

    CONSTRAINT "AllowedSystemUserEmail_pkey" PRIMARY KEY ("email")
);
