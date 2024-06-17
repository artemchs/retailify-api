-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductSeason" ADD VALUE 'SPRING_SUMMER';
ALTER TYPE "ProductSeason" ADD VALUE 'DEMI_SEASON';
ALTER TYPE "ProductSeason" ADD VALUE 'SPRING_WINTER';
ALTER TYPE "ProductSeason" ADD VALUE 'FALL';
