/*
  Warnings:

  - The `status` column on the `bookings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `hotels` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `commission_agreements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "HotelStatus" AS ENUM ('STANDARD', 'PREFERRED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FLAT_FEE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "tier_rules" DROP CONSTRAINT "tier_rules_commissionAgreementId_fkey";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "commission_agreements" DROP COLUMN "type",
ADD COLUMN     "type" "CommissionType" NOT NULL;

-- AlterTable
ALTER TABLE "hotels" DROP COLUMN "status",
ADD COLUMN     "status" "HotelStatus" NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE INDEX "bookings_hotelId_status_completedAt_idx" ON "bookings"("hotelId", "status", "completedAt");

-- CreateIndex
CREATE INDEX "tier_rules_commissionAgreementId_idx" ON "tier_rules"("commissionAgreementId");

-- AddForeignKey
ALTER TABLE "tier_rules" ADD CONSTRAINT "tier_rules_commissionAgreementId_fkey" FOREIGN KEY ("commissionAgreementId") REFERENCES "commission_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
