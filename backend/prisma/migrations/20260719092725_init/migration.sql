-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('completed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('charge', 'refund');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('settled', 'pending', 'failed');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('EXACT_MATCH', 'MISSING_ORDER', 'MISSING_PAYMENT', 'AMOUNT_MISMATCH', 'PARTIAL_REFUND', 'PENDING_PAYMENT', 'FAILED_PAYMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "normalizedOrderId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "customerEmail" TEXT,
    "currency" TEXT NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "orderReference" TEXT NOT NULL,
    "normalizedOrderId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fee" DECIMAL(12,2) NOT NULL,
    "netSettled" DECIMAL(12,2) NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "normalizedOrderId" TEXT NOT NULL,
    "status" "ReconciliationStatus" NOT NULL,
    "expectedAmount" DECIMAL(12,2),
    "actualAmount" DECIMAL(12,2),
    "difference" DECIMAL(12,2),
    "currency" TEXT,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_userId_normalizedOrderId_idx" ON "Order"("userId", "normalizedOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_normalizedOrderId_key" ON "Order"("userId", "normalizedOrderId");

-- CreateIndex
CREATE INDEX "Payment_userId_normalizedOrderId_idx" ON "Payment"("userId", "normalizedOrderId");

-- CreateIndex
CREATE INDEX "Payment_userId_status_type_idx" ON "Payment"("userId", "status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_userId_transactionRef_key" ON "Payment"("userId", "transactionRef");

-- CreateIndex
CREATE INDEX "ReconciliationResult_userId_status_idx" ON "ReconciliationResult"("userId", "status");

-- CreateIndex
CREATE INDEX "ReconciliationResult_userId_normalizedOrderId_idx" ON "ReconciliationResult"("userId", "normalizedOrderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationResult" ADD CONSTRAINT "ReconciliationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationResult" ADD CONSTRAINT "ReconciliationResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationResult" ADD CONSTRAINT "ReconciliationResult_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
