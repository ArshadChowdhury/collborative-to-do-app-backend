import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TenantsRepository } from './tenants.repository';
import { CreateTenantDto } from './tenants.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantsRepo: TenantsRepository,
    private readonly db: DatabaseService,
  ) {}

  async create(dto: CreateTenantDto, ownerUserId: string) {
    const existing = await this.tenantsRepo.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Tenant slug already taken');

    const tenant = await this.tenantsRepo.create(dto);

    // provision dedicated schema + tables for this tenant
    await this.db.createTenantSchema(dto.slug);

    // creator becomes owner
    await this.tenantsRepo.addMember(tenant.id, ownerUserId, 'owner');

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async getMembers(tenantId: string) {
    return this.tenantsRepo.getMembers(tenantId);
  }

  async addMember(tenantId: string, userId: string, role: 'owner' | 'admin' | 'member') {
    const tenant = await this.tenantsRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.tenantsRepo.addMember(tenantId, userId, role);
  }

  async removeMember(tenantId: string, userId: string) {
    await this.tenantsRepo.removeMember(tenantId, userId);
  }
}