import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  PROMPT_COMPLETED_EVENT_NAME,
  PromptCompletedRealtimeEvent,
} from 'src/realtime/prompt-notification.events';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class PromptNotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(PromptNotificationsGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const userId = await this.resolveUserId(client);

    if (!userId) {
      client.disconnect(true);
      return;
    }

    await client.join(this.getUserRoom(userId));
  }

  emitPromptCompleted(event: PromptCompletedRealtimeEvent): void {
    this.server
      .to(this.getUserRoom(event.userId))
      .emit(PROMPT_COMPLETED_EVENT_NAME, event);
  }

  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  private extractAccessToken(client: Socket): string | null {
    const tokenFromAuth = client.handshake.auth?.token;
    if (typeof tokenFromAuth === 'string' && tokenFromAuth.trim()) {
      return tokenFromAuth.trim();
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization !== 'string') {
      return null;
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private async resolveUserId(client: Socket): Promise<string | null> {
    const token = this.extractAccessToken(client);
    if (!token) {
      return null;
    }

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync<{
        type?: string;
        sub?: string;
      }>(token, accessSecret ? { secret: accessSecret } : undefined);

      if (payload.type !== 'access' || !payload.sub) {
        return null;
      }

      return payload.sub;
    } catch (error) {
      this.logger.warn(
        `Failed to authenticate websocket client: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
