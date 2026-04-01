import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface Board {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class BoardsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(tenantSlug: string): Promise<Board[]> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        'SELECT * FROM boards ORDER BY created_at DESC',
      );
      return result.rows;
    });
  }

  async findById(tenantSlug: string, id: string): Promise<Board | null> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        'SELECT * FROM boards WHERE id = $1',
        [id],
      );
      return result.rows[0] ?? null;
    });
  }

  async create(
    tenantSlug: string,
    data: { name: string; description?: string },
  ): Promise<Board> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        `INSERT INTO boards (name, description)
         VALUES ($1, $2)
         RETURNING *`,
        [data.name, data.description ?? null],
      );
      return result.rows[0];
    });
  }

  async update(
    tenantSlug: string,
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Board | null> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        `UPDATE boards
         SET name        = COALESCE($2, name),
             description = COALESCE($3, description),
             updated_at  = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, data.name ?? null, data.description ?? null],
      );
      return result.rows[0] ?? null;
    });
  }

  async delete(tenantSlug: string, id: string): Promise<boolean> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        'DELETE FROM boards WHERE id = $1',
        [id],
      );
      return (result.rowCount ?? 0) > 0;
    });
  }
}