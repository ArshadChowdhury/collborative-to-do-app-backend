import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor(private config: ConfigService) {
    this.pool = new Pool({
      host: config.get('DB_HOST', 'localhost'),
      port: config.get<number>('DB_PORT', 5432),
      user: config.get('DB_USERNAME', 'postgres'),
      password: config.get('DB_PASSWORD', 'postgres'),
      database: config.get('DB_NAME', 'todo_app'),
      max: 20,
    });
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /** Returns a client with search_path + app.current_tenant set for RLS */
  async getTenantClient(tenantSlug: string): Promise<PoolClient> {
    const schema = this.sanitizeSchema(tenantSlug);
    const client = await this.pool.connect();
    // sanitizeSchema already validates the slug — safe to interpolate
    await client.query(`SET search_path TO ${schema}, public`);
    await client.query(`SET app.current_tenant TO '${tenantSlug}'`);
    return client;
  }

  async withTenantClient<T>(
    tenantSlug: string,
    fn: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.getTenantClient(tenantSlug);
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async createTenantSchema(tenantSlug: string): Promise<void> {
    const schema = this.sanitizeSchema(tenantSlug);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

      // boards table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.boards (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name        VARCHAR(255) NOT NULL,
          description TEXT,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // todos table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.todos (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          board_id    UUID NOT NULL REFERENCES ${schema}.boards(id) ON DELETE CASCADE,
          title       VARCHAR(255) NOT NULL,
          description TEXT,
          status      VARCHAR(20) NOT NULL DEFAULT 'todo'
                        CHECK (status IN ('todo','in-progress','done')),
          assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
          created_by  UUID NOT NULL REFERENCES public.users(id),
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // RLS on boards
      await client.query(`ALTER TABLE ${schema}.boards ENABLE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE ${schema}.boards FORCE ROW LEVEL SECURITY`);
      await client.query(`DROP POLICY IF EXISTS boards_tenant_isolation ON ${schema}.boards`);
      await client.query(
        `CREATE POLICY boards_tenant_isolation ON ${schema}.boards
         USING (current_setting('app.current_tenant', TRUE) = '${tenantSlug}')`,
      );

      // RLS on todos
      await client.query(`ALTER TABLE ${schema}.todos ENABLE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE ${schema}.todos FORCE ROW LEVEL SECURITY`);
      await client.query(`DROP POLICY IF EXISTS todos_tenant_isolation ON ${schema}.todos`);
      await client.query(
        `CREATE POLICY todos_tenant_isolation ON ${schema}.todos
         USING (current_setting('app.current_tenant', TRUE) = '${tenantSlug}')`,
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Strict allowlist: only lowercase letters, digits, underscores */
  sanitizeSchema(slug: string): string {
    if (!/^[a-z0-9_]+$/.test(slug)) {
      throw new Error(`Invalid tenant slug: ${slug}`);
    }
    return `tenant_${slug}`;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}