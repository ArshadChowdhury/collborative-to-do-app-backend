import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type TodoStatus = 'todo' | 'in-progress' | 'done';

export interface Todo {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  assignee_id: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class TodosRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByBoard(tenantSlug: string, boardId: string): Promise<Todo[]> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        `SELECT t.*,
                u.display_name AS assignee_name
         FROM todos t
         LEFT JOIN public.users u ON u.id = t.assignee_id
         WHERE t.board_id = $1
         ORDER BY t.created_at ASC`,
        [boardId],
      );
      return result.rows;
    });
  }

  async findById(tenantSlug: string, id: string): Promise<Todo | null> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        `SELECT t.*, u.display_name AS assignee_name
         FROM todos t
         LEFT JOIN public.users u ON u.id = t.assignee_id
         WHERE t.id = $1`,
        [id],
      );
      return result.rows[0] ?? null;
    });
  }

  async create(
    tenantSlug: string,
    data: {
      board_id: string;
      title: string;
      description?: string;
      status?: TodoStatus;
      assignee_id?: string;
      created_by: string;
    },
  ): Promise<Todo> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        `INSERT INTO todos (board_id, title, description, status, assignee_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.board_id,
          data.title,
          data.description ?? null,
          data.status ?? 'todo',
          data.assignee_id ?? null,
          data.created_by,
        ],
      );
      return result.rows[0];
    });
  }

  async update(
    tenantSlug: string,
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: TodoStatus;
      assignee_id?: string | null;
    },
  ): Promise<Todo | null> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        `UPDATE todos
         SET title       = COALESCE($2, title),
             description = COALESCE($3, description),
             status      = COALESCE($4, status),
             assignee_id = CASE WHEN $5::boolean THEN $6::uuid ELSE assignee_id END,
             updated_at  = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          data.title ?? null,
          data.description ?? null,
          data.status ?? null,
          'assignee_id' in data,   // true = explicit update (even to null)
          data.assignee_id ?? null,
        ],
      );
      return result.rows[0] ?? null;
    });
  }

  async delete(tenantSlug: string, id: string): Promise<Todo | null> {
    return this.db.withTenantClient(tenantSlug, async (client) => {
      const result = await client.query(
        'DELETE FROM todos WHERE id = $1 RETURNING *',
        [id],
      );
      return result.rows[0] ?? null;
    });
  }
}