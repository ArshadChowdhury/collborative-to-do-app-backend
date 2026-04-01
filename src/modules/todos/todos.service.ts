import { Injectable, NotFoundException } from '@nestjs/common';
import { BoardsRepository } from '../boards/boards.repository';
import { CreateTodoDto, UpdateTodoDto } from './dto/todos.dto';
import { TodosGateway } from './todos.gateway';
import { TodosRepository } from './todos.repository';

@Injectable()
export class TodosService {
  constructor(
    private readonly todosRepo: TodosRepository,
    private readonly boardsRepo: BoardsRepository,
    private readonly gateway: TodosGateway,
  ) {}

  async findByBoard(tenantSlug: string, boardId: string) {
    await this.assertBoardExists(tenantSlug, boardId);
    return this.todosRepo.findByBoard(tenantSlug, boardId);
  }

  async findOne(tenantSlug: string, boardId: string, id: string) {
    await this.assertBoardExists(tenantSlug, boardId);
    const todo = await this.todosRepo.findById(tenantSlug, id);
    if (!todo || todo.board_id !== boardId)
      throw new NotFoundException('Todo not found');
    return todo;
  }

  async create(
    tenantSlug: string,
    boardId: string,
    dto: CreateTodoDto,
    userId: string,
  ) {
    await this.assertBoardExists(tenantSlug, boardId);
    const todo = await this.todosRepo.create(tenantSlug, {
      board_id: boardId,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      assignee_id: dto.assigneeId,
      created_by: userId,
    });

    this.gateway.broadcastToBoard(tenantSlug, boardId, 'todo:created', todo);
    return todo;
  }

  async update(
    tenantSlug: string,
    boardId: string,
    id: string,
    dto: UpdateTodoDto,
  ) {
    await this.assertBoardExists(tenantSlug, boardId);
    const updateData: Parameters<typeof this.todosRepo.update>[2] = {
      title: dto.title,
      description: dto.description,
      status: dto.status,
    };
    if (dto.assigneeId !== undefined) {
      updateData.assignee_id = dto.assigneeId;
    }
    const todo = await this.todosRepo.update(tenantSlug, id, updateData);
    if (!todo || todo.board_id !== boardId)
      throw new NotFoundException('Todo not found');

    this.gateway.broadcastToBoard(tenantSlug, boardId, 'todo:updated', todo);
    return todo;
  }

  async remove(tenantSlug: string, boardId: string, id: string) {
    await this.assertBoardExists(tenantSlug, boardId);
    const todo = await this.todosRepo.delete(tenantSlug, id);
    if (!todo || todo.board_id !== boardId)
      throw new NotFoundException('Todo not found');

    this.gateway.broadcastToBoard(tenantSlug, boardId, 'todo:deleted', {
      id: todo.id,
      boardId,
    });
    return { deleted: true };
  }

  private async assertBoardExists(tenantSlug: string, boardId: string) {
    const board = await this.boardsRepo.findById(tenantSlug, boardId);
    if (!board) throw new NotFoundException('Board not found');
  }
}