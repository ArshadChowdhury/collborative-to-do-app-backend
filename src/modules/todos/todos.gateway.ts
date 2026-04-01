import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../users/users.repository';

export type TodoEvent = 'todo:created' | 'todo:updated' | 'todo:deleted';

export interface TodoEventPayload {
  event: TodoEvent;
  boardId: string;
  tenantSlug: string;
  data: any;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/boards',
})
export class TodosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(TodosGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepo: UsersRepository,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersRepo.findById(payload.sub);
      if (!user) {
        client.disconnect();
        return;
      }

      // Attach user to socket data for later use
      client.data.user = user;
      this.logger.log(`Client connected: ${client.id} (${user.email})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins a board room scoped to a tenant.
   * Room name: `{tenantSlug}:{boardId}`
   * This ensures users from different tenants watching the same boardId
   * never bleed into each other's rooms.
   */
  @SubscribeMessage('board:join')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; tenantSlug: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    // Verify user belongs to this tenant
    const belongsToTenant = user.tenants?.some(
      (t: any) => t.slug === payload.tenantSlug,
    );
    if (!belongsToTenant) {
      client.emit('error', { message: 'Access denied' });
      return;
    }

    const room = this.buildRoom(payload.tenantSlug, payload.boardId);
    await client.join(room);
    this.logger.log(`${user.email} joined room ${room}`);
    client.emit('board:joined', { room });
  }

  @SubscribeMessage('board:leave')
  async handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { boardId: string; tenantSlug: string },
  ) {
    const room = this.buildRoom(payload.tenantSlug, payload.boardId);
    await client.leave(room);
    client.emit('board:left', { room });
  }

  /** Called by TodosService to broadcast changes to the room */
  broadcastToBoard(
    tenantSlug: string,
    boardId: string,
    event: TodoEvent,
    data: any,
  ) {
    const room = this.buildRoom(tenantSlug, boardId);
    this.server.to(room).emit(event, data);
  }

  private buildRoom(tenantSlug: string, boardId: string): string {
    return `${tenantSlug}:${boardId}`;
  }
}