import { Injectable } from '@nestjs/common';
import { TenantConnectionService } from '../../database/tenant-connection.service';
import { Board } from './board.entity';

export { Board };

@Injectable()
export class BoardsRepository {
  constructor(private readonly tenantConn: TenantConnectionService) {}

  async findAll(tenantSlug: string): Promise<Board[]> {
    const repo = await this.tenantConn.getBoardRepository(tenantSlug);
    return repo.find({ order: { created_at: 'DESC' } });
  }

  async findById(tenantSlug: string, id: string): Promise<Board | null> {
    const repo = await this.tenantConn.getBoardRepository(tenantSlug);
    return repo.findOne({ where: { id } });
  }

  async create(tenantSlug: string, data: { name: string; description?: string }): Promise<Board> {
    const repo = await this.tenantConn.getBoardRepository(tenantSlug);
    const board = repo.create({ name: data.name, description: data.description ?? null });
    return repo.save(board);
  }

  async update(
    tenantSlug: string,
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Board | null> {
    const repo = await this.tenantConn.getBoardRepository(tenantSlug);
    await repo.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    });
    return repo.findOne({ where: { id } });
  }

  async delete(tenantSlug: string, id: string): Promise<boolean> {
    const repo = await this.tenantConn.getBoardRepository(tenantSlug);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}