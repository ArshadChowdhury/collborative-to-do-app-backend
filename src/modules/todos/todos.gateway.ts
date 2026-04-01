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
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    namespace: '/boards',
})
export class TodosGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    private readonly logger = new Logger(TodosGateway.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly usersRepo: UsersRepository,
    ) { }

    // async handleConnection(client: Socket) {
    //     try {
    //         const token =
    //             client.handshake.auth?.token ||
    //             client.handshake.headers?.authorization?.replace('Bearer ', '');

    //         if (!token) {
    //             client.disconnect();
    //             return;
    //         }

    //         const payload = this.jwtService.verify(token);
    //         const user = await this.usersRepo.findById(payload.sub);
    //         if (!user) {
    //             client.disconnect();
    //             return;
    //         }

    //         // Attach user to socket data for later use
    //         client.data.user = user;
    //         this.logger.log(`Client connected: ${client.id} (${user.email})`);
    //     } catch {
    //         client.disconnect();
    //     }
    // }

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

            client.data.user = user;
            this.logger.log(`Client connected: ${client.id} (${user.email})`);
        } catch (err) {
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
        // handleConnection is async — user may not be set yet on first emit
        // wait up to 2s for it to complete
        let user = client.data.user;
        if (!user) {
            await new Promise<void>((resolve) => {
                let attempts = 0;
                const interval = setInterval(() => {
                    user = client.data.user;
                    attempts++;
                    if (user || attempts >= 20) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
        }

        if (!user) {
            client.emit('error', { message: 'Authentication timeout' });
            return;
        }

        const belongsToTenant = user.userTenants?.some(
            (ut: any) => ut.tenant?.slug === payload.tenantSlug,
        );

        if (!belongsToTenant) {
            client.emit('error', { message: 'Access denied' });
            return;
        }

        const room = this.buildRoom(payload.tenantSlug, payload.boardId);
        await client.join(room);
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
    broadcastToBoard(tenantSlug: string, boardId: string, event: TodoEvent, data: any) {
        const room = this.buildRoom(tenantSlug, boardId);
        this.server.to(room).emit(event, data);  // ← remove the .adapter.rooms line
    }

    private buildRoom(tenantSlug: string, boardId: string): string {
        return `${tenantSlug}:${boardId}`;
    }
}