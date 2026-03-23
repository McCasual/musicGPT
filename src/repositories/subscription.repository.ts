import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from 'generated/prisma/client';
import { PrismaService } from 'src/infrastructure/prisma.service';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createInitiatedPaidSubscription(input: {
    userId: string;
    pidx: string;
    purchaseOrderId: string;
    purchaseOrderName: string;
    amount: number;
    paymentUrl: string;
    expiresAt: Date | null;
  }) {
    return this.prisma.subscription.create({
      data: {
        userId: input.userId,
        tier: SubscriptionStatus.PAID,
        gateway: 'KHALTI',
        pidx: input.pidx,
        purchaseOrderId: input.purchaseOrderId,
        purchaseOrderName: input.purchaseOrderName,
        amount: input.amount,
        paymentUrl: input.paymentUrl,
        gatewayStatus: 'Initiated',
        expiresAt: input.expiresAt,
      },
    });
  }

  async findByPidx(pidx: string) {
    return this.prisma.subscription.findUnique({
      where: { pidx },
    });
  }

  async hasActivePaidSubscription(userId: string): Promise<boolean> {
    const count = await this.prisma.subscription.count({
      where: {
        userId,
        tier: SubscriptionStatus.PAID,
        active: true,
      },
    });

    return count > 0;
  }

  async cancelUserSubscription(userId: string) {
    await this.prisma.$transaction([
      this.prisma.subscription.updateMany({
        where: { userId, active: true },
        data: {
          active: false,
          gatewayStatus: 'CANCELED_BY_USER',
          canceledAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: SubscriptionStatus.FREE },
      }),
    ]);
  }

  async syncPaymentStatus(input: {
    subscriptionId: string;
    userId: string;
    totalAmount: number;
    gatewayStatus: string;
    transactionId: string | null;
    shouldActivate: boolean;
    shouldMarkInactive: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: input.subscriptionId },
        data: {
          amount: input.totalAmount,
          transactionId: input.transactionId,
          gatewayStatus: input.gatewayStatus,
          active: input.shouldActivate
            ? true
            : input.shouldMarkInactive
              ? false
              : undefined,
        },
      });

      if (input.shouldActivate) {
        await tx.subscription.updateMany({
          where: {
            userId: input.userId,
            id: { not: input.subscriptionId },
            active: true,
          },
          data: { active: false },
        });

        await tx.user.update({
          where: { id: input.userId },
          data: { subscriptionStatus: SubscriptionStatus.PAID },
        });
      } else if (input.shouldMarkInactive) {
        const activePaidCount = await tx.subscription.count({
          where: {
            userId: input.userId,
            tier: SubscriptionStatus.PAID,
            active: true,
          },
        });

        if (activePaidCount === 0) {
          await tx.user.update({
            where: { id: input.userId },
            data: { subscriptionStatus: SubscriptionStatus.FREE },
          });
        }
      }

      return updated;
    });
  }
}
