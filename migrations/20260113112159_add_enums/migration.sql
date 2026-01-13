-- CreateEnum
CREATE TYPE "HotelStatus" AS ENUM ('STANDARD', 'PREFERRED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FLAT_FEE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "HotelStatus" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_agreements" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "type" "CommissionType" NOT NULL,
    "baseRate" DECIMAL(5,4),
    "flatAmount" DECIMAL(10,2),
    "preferredBonus" DECIMAL(5,4),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_rules" (
    "id" TEXT NOT NULL,
    "commissionAgreementId" TEXT NOT NULL,
    "minBookings" INTEGER NOT NULL,
    "bonusRate" DECIMAL(5,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tier_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_calculations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "commissionAgreementId" TEXT NOT NULL,
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "baseRate" DECIMAL(5,4),
    "preferredBonus" DECIMAL(10,2),
    "tierBonus" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "calculationDetails" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commission_agreements_hotelId_validFrom_validTo_isActive_idx" ON "commission_agreements"("hotelId", "validFrom", "validTo", "isActive");

-- CreateIndex
CREATE INDEX "commission_agreements_hotelId_isActive_idx" ON "commission_agreements"("hotelId", "isActive");

-- CreateIndex
CREATE INDEX "tier_rules_commissionAgreementId_idx" ON "tier_rules"("commissionAgreementId");

-- CreateIndex
CREATE INDEX "bookings_hotelId_status_completedAt_idx" ON "bookings"("hotelId", "status", "completedAt");

-- CreateIndex
CREATE INDEX "bookings_hotelId_completedAt_idx" ON "bookings"("hotelId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "commission_calculations_bookingId_key" ON "commission_calculations"("bookingId");

-- CreateIndex
CREATE INDEX "commission_calculations_hotelId_calculatedAt_idx" ON "commission_calculations"("hotelId", "calculatedAt");

-- CreateIndex
CREATE INDEX "commission_calculations_calculatedAt_idx" ON "commission_calculations"("calculatedAt");

-- AddForeignKey
ALTER TABLE "commission_agreements" ADD CONSTRAINT "commission_agreements_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_rules" ADD CONSTRAINT "tier_rules_commissionAgreementId_fkey" FOREIGN KEY ("commissionAgreementId") REFERENCES "commission_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_calculations" ADD CONSTRAINT "commission_calculations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_calculations" ADD CONSTRAINT "commission_calculations_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_calculations" ADD CONSTRAINT "commission_calculations_commissionAgreementId_fkey" FOREIGN KEY ("commissionAgreementId") REFERENCES "commission_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
