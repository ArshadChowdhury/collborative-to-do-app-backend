import { Injectable, NotFoundException } from '@nestjs/common';
import { BoardsRepository } from './boards.repository';
import { CreateBoardDto, UpdateBoardDto } from './dto/boards.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly boardsRepo: BoardsRepository) {}

  findAll(tenantSlug: string) {
    return this.boardsRepo.findAll(tenantSlug);
  }

  async findOne(tenantSlug: string, id: string) {
    const board = await this.boardsRepo.findById(tenantSlug, id);
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  create(tenantSlug: string, dto: CreateBoardDto) {
    return this.boardsRepo.create(tenantSlug, dto);
  }

  async update(tenantSlug: string, id: string, dto: UpdateBoardDto) {
    const board = await this.boardsRepo.update(tenantSlug, id, dto);
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async remove(tenantSlug: string, id: string) {
    const deleted = await this.boardsRepo.delete(tenantSlug, id);
    if (!deleted) throw new NotFoundException('Board not found');
    return { deleted: true };
  }
}