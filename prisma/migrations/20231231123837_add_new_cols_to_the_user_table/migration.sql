/*
  Warnings:

  - You are about to drop the column `username` on the `SystemUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `SystemUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `SystemUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `SystemUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SystemUser_username_key";

-- AlterTable
ALTER TABLE "SystemUser" DROP COLUMN "username",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_email_key" ON "SystemUser"("email");
