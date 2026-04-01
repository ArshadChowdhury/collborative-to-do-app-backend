import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { Board } from '../modules/boards/board.entity';
import { Todo } from '../modules/todos/todo.entity';

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
    private readonly logger = new Logger(TenantConnectionService.name);
    private readonly connections = new Map<string, DataSource>();

    constructor(private readonly config: ConfigService) { }

    async getConnection(tenantSlug: string): Promise<DataSource> {
        if (this.connections.has(tenantSlug)) {
            return this.connections.get(tenantSlug)!;
        }

        const schema = this.sanitizeSchema(tenantSlug);

        // Must create the schema BEFORE TypeORM synchronize runs
        const tempDs = new DataSource({
            type: 'postgres',
            host: this.config.get('DB_HOST', 'localhost'),
            port: this.config.get<number>('DB_PORT', 5432),
            username: this.config.get('DB_USERNAME', 'postgres'),
            password: this.config.get('DB_PASSWORD', 'postgres'),
            database: this.config.get('DB_NAME', 'todo_app'),
            entities: [],
            synchronize: false,
        });

        await tempDs.initialize();
        await tempDs.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        await tempDs.destroy();

        // Now initialize the real tenant DataSource — schema exists, sync will work
        const ds = new DataSource({
            type: 'postgres',
            host: this.config.get('DB_HOST', 'localhost'),
            port: this.config.get<number>('DB_PORT', 5432),
            username: this.config.get('DB_USERNAME', 'postgres'),
            password: this.config.get('DB_PASSWORD', 'postgres'),
            database: this.config.get('DB_NAME', 'todo_app'),
            schema,
            entities: [Board, Todo],
            synchronize: true,
            poolSize: 5,
        });

        await ds.initialize();
        this.connections.set(tenantSlug, ds);
        this.logger.log(`DataSource initialized for tenant: ${tenantSlug} (schema: ${schema})`);
        return ds;
    }

    async getBoardRepository(tenantSlug: string): Promise<Repository<Board>> {
        const ds = await this.getConnection(tenantSlug);
        return ds.getRepository(Board);
    }

    async getTodoRepository(tenantSlug: string): Promise<Repository<Todo>> {
        const ds = await this.getConnection(tenantSlug);
        return ds.getRepository(Todo);
    }

    sanitizeSchema(slug: string): string {
        if (!/^[a-z0-9_]+$/.test(slug)) {
            throw new Error(`Invalid tenant slug: ${slug}`);
        }
        return `tenant_${slug}`;
    }

    async onModuleDestroy() {
        for (const [slug, ds] of this.connections) {
            if (ds.isInitialized) {
                await ds.destroy();
                this.logger.log(`DataSource destroyed for tenant: ${slug}`);
            }
        }
    }
}