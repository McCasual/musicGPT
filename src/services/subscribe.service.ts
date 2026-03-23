import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscribeDto } from 'src/dtos/subscribe.dto';
import { SubscriptionRepository } from 'src/repositories/subscription.repository';
import { UsersRepository } from 'src/repositories/users.repository';

interface KhaltiInitiateResponse extends Record<string, unknown> {
  pidx?: string;
  payment_url?: string;
  expires_at?: string;
}

interface KhaltiLookupResponse extends Record<string, unknown> {
  pidx?: string;
  total_amount?: number;
  status?: string;
  transaction_id?: string | null;
  refunded?: boolean;
}

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly configService: ConfigService,
  ) {}

  async subscribe(userId: string, body: SubscribeDto) {
    if (body.type !== 'PAID') {
      throw new BadRequestException(
        'Only PAID subscriptions can be initiated from this endpoint.',
      );
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const hasActivePaidSubscription =
      await this.subscriptionRepository.hasActivePaidSubscription(userId);
    if (user.subscriptionStatus === 'PAID' || hasActivePaidSubscription) {
      throw new ConflictException(
        'User is already subscribed to the paid plan.',
      );
    }

    const websiteUrl = this.resolveWebsiteUrl();
    const returnUrl = this.resolveReturnUrl(websiteUrl);
    const amount = this.resolvePaidPlanAmount();
    const purchaseOrderName =
      this.configService.get<string>('KHALTI_PAID_PLAN_NAME') ??
      'Paid Subscription';
    const purchaseOrderId = `subscription-${userId}-${Date.now()}`;

    const initiatePayload = {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: purchaseOrderName,
      customer_info: {
        name: user.displayName,
        email: user.email,
      },
    };

    const initiateResponse = await this.postToKhalti<KhaltiInitiateResponse>(
      '/api/v2/epayment/initiate/',
      initiatePayload,
    );

    if (!initiateResponse.ok) {
      throw new BadGatewayException(
        this.extractGatewayError(initiateResponse.body) ??
          'Failed to initiate Khalti payment.',
      );
    }

    const pidx = initiateResponse.body.pidx;
    const paymentUrl = initiateResponse.body.payment_url;
    const expiresAtRaw = initiateResponse.body.expires_at;

    if (!pidx || !paymentUrl) {
      throw new BadGatewayException(
        'Khalti payment initiation returned incomplete response.',
      );
    }

    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

    const subscription =
      await this.subscriptionRepository.createInitiatedPaidSubscription({
        userId,
        pidx,
        purchaseOrderId,
        purchaseOrderName,
        amount,
        paymentUrl,
        expiresAt:
          expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      });

    return {
      message: 'Khalti payment initiated.',
      pidx: subscription.pidx,
      paymentUrl: subscription.paymentUrl,
      expiresAt: subscription.expiresAt,
      purchaseOrderId: subscription.purchaseOrderId,
    };
  }

  async cancelSubscription(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.subscriptionRepository.cancelUserSubscription(userId);

    return {
      message: 'Subscription canceled.',
      subscriptionStatus: 'FREE',
    };
  }

  async checkPaymentStatus(pidx: string, actorUserId?: string) {
    const subscription = await this.subscriptionRepository.findByPidx(pidx);

    if (!subscription) {
      throw new NotFoundException('Subscription not found for provided pidx.');
    }

    if (actorUserId && subscription.userId !== actorUserId) {
      throw new ForbiddenException(
        'You are not allowed to update this subscription.',
      );
    }

    const lookupResponse = await this.postToKhalti<KhaltiLookupResponse>(
      '/api/v2/epayment/lookup/',
      { pidx },
    );

    if (
      !lookupResponse.body.status ||
      !lookupResponse.body.pidx ||
      (lookupResponse.statusCode >= 500 && !lookupResponse.ok)
    ) {
      throw new BadGatewayException(
        this.extractGatewayError(lookupResponse.body) ??
          'Failed to lookup Khalti payment status.',
      );
    }

    const gatewayStatus = lookupResponse.body.status;
    const transactionId = lookupResponse.body.transaction_id ?? null;
    const totalAmount =
      typeof lookupResponse.body.total_amount === 'number'
        ? lookupResponse.body.total_amount
        : subscription.amount;

    const shouldActivate = gatewayStatus === 'Completed';
    const shouldMarkInactive = [
      'Expired',
      'User canceled',
      'Refunded',
      'Partially Refunded',
    ].includes(gatewayStatus);

    const updatedSubscription = await this.subscriptionRepository.syncPaymentStatus(
      {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        totalAmount,
        gatewayStatus,
        transactionId,
        shouldActivate,
        shouldMarkInactive,
      },
    );

    return {
      pidx: updatedSubscription.pidx,
      status: updatedSubscription.gatewayStatus,
      transactionId: updatedSubscription.transactionId,
      active: updatedSubscription.active,
    };
  }

  private async postToKhalti<T extends Record<string, unknown>>(
    path: string,
    payload: Record<string, unknown>,
  ): Promise<{
    ok: boolean;
    statusCode: number;
    body: T;
  }> {
    const secretKey = this.configService.get<string>('KHALTI_LIVE_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException(
        'KHALTI_LIVE_SECRET_KEY is not configured.',
      );
    }

    const baseUrl = this.resolveKhaltiBaseUrl();
    const endpoint = `${baseUrl}${path.startsWith('/') ? path.slice(1) : path}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new BadGatewayException('Unable to reach Khalti payment gateway.');
    }

    let parsedBody: T = {} as T;
    try {
      parsedBody = (await response.json()) as T;
    } catch {
      parsedBody = {} as T;
    }

    return {
      ok: response.ok,
      statusCode: response.status,
      body: parsedBody,
    };
  }

  private resolveKhaltiBaseUrl(): string {
    const configuredBase =
      this.configService.get<string>('KHALTI_BASE_URL')?.trim() ??
      'https://dev.khalti.com/api/v2/';

    return configuredBase.endsWith('/')
      ? configuredBase
      : `${configuredBase}/`;
  }

  private resolveReturnUrl(websiteUrl: string): string {
    return `${websiteUrl}/subscription/status`;
  }

  private resolveWebsiteUrl(): string {
    const configured =
      this.configService.get<string>('BACKEND_FQDN')?.trim() ||
      this.configService.get<string>('WEBSITE_URL')?.trim();

    if (!configured) {
      throw new InternalServerErrorException(
        'BACKEND_FQDN is required for Khalti integration.',
      );
    }

    let backendUrl: URL;
    try {
      backendUrl = new URL(configured);
    } catch {
      throw new InternalServerErrorException(
        'BACKEND_FQDN must be a valid absolute URL (for example, https://api.example.com).',
      );
    }

    return backendUrl.origin;
  }

  private resolvePaidPlanAmount(): number {
    const configured =
      this.configService.get<string>('KHALTI_PAID_PLAN_AMOUNT')?.trim();
    if (!configured) {
      throw new InternalServerErrorException(
        'KHALTI_PAID_PLAN_AMOUNT is not configured.',
      );
    }

    const parsed = Number.parseInt(configured, 10);

    if (!Number.isInteger(parsed) || parsed < 1000) {
      throw new InternalServerErrorException(
        'KHALTI_PAID_PLAN_AMOUNT must be an integer amount in paisa >= 1000.',
      );
    }

    return parsed;
  }

  private extractGatewayError(body: Record<string, unknown>): string | null {
    if (typeof body.detail === 'string') {
      return body.detail;
    }

    if (Array.isArray(body.detail) && body.detail[0]) {
      return String(body.detail[0]);
    }

    if (typeof body.error_key === 'string') {
      return body.error_key;
    }

    for (const value of Object.values(body)) {
      if (typeof value === 'string') {
        return value;
      }

      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }
    }

    return null;
  }
}
