import { Injectable } from '@nestjs/common';
import { TenantConnectionService } from '../../database/tenant-connection.service';
import { Todo, TodoStatus } from './todo.entity';

export { Todo };

@Injectable()
export class TodosRepository {
  constructor(private readonly tenantConn: TenantConnectionService) {}

  async findByBoard(tenantSlug: string, boardId: string): Promise<Todo[]> {
    const repo = await this.tenantConn.getTodoRepository(tenantSlug);
    return repo.find({
      where: { board_id: boardId },
      order: { created_at: 'ASC' },
    });
  }

  async findById(tenantSlug: string, id: string): Promise<Todo | null> {
    const repo = await this.tenantConn.getTodoRepository(tenantSlug);
    return repo.findOne({ where: { id } });
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
    const repo = await this.tenantConn.getTodoRepository(tenantSlug);
    const todo = repo.create({
      board_id: data.board_id,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'todo',
      assignee_id: data.assignee_id ?? null,
      created_by: data.created_by,
    });
    return repo.save(todo);
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
    const repo = await this.tenantConn.getTodoRepository(tenantSlug);
    const updatePayload: Partial<Todo> = {};
    if (data.title !== undefined)       updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.status !== undefined)      updatePayload.status = data.status;
    if ('assignee_id' in data)          updatePayload.assignee_id = data.assignee_id ?? null;

    await repo.update(id, updatePayload);
    return repo.findOne({ where: { id } });
  }

  async delete(tenantSlug: string, id: string): Promise<Todo | null> {
    const repo = await this.tenantConn.getTodoRepository(tenantSlug);
    const todo = await repo.findOne({ where: { id } });
    if (!todo) return null;
    await repo.delete(id);
    return todo;
  }
}