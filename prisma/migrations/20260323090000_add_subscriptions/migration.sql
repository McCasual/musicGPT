-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tier" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
    "gateway" TEXT NOT NULL DEFAULT 'KHALTI',
    "pidx" TEXT,
    "purchase_order_id" TEXT NOT NULL,
    "purchase_order_name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_url" TEXT NOT NULL,
    "gateway_status" TEXT NOT NULL DEFAULT 'Initiated',
    "transaction_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_pidx_key" ON "subscriptions"("pidx");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_created_at_idx" ON "subscriptions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_active_idx" ON "subscriptions"("user_id", "active");

-- CreateIndex
CREATE INDEX "subscriptions_gateway_status_idx" ON "subscriptions"("gateway_status");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
