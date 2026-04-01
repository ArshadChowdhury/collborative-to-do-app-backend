import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantConnectionService } from '../../database/tenant-connection.service';
import { TenantsRepository } from './tenants.repository';
import { CreateTenantDto } from './dto/tenants.dto';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantsRepo: TenantsRepository,
    private readonly tenantConn: TenantConnectionService,
    private readonly usersRepo: UsersRepository,

  ) { }

  async create(dto: CreateTenantDto, ownerUserId: string) {
    const existing = await this.tenantsRepo.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Tenant slug already taken');

    const tenant = await this.tenantsRepo.create(dto);

    // Initialise a DataSource for this tenant — TypeORM synchronize:true
    // will auto-create boards + todos tables in the tenant schema
    await this.tenantConn.getConnection(dto.slug);

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

  async addMember(tenantId: string, email: string, role: 'owner' | 'admin' | 'member') {
    const tenant = await this.tenantsRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const user = await this.usersRepo.findByEmail(email);
    if (!user) throw new NotFoundException('No user found with that email address');

    await this.tenantsRepo.addMember(tenantId, user.id, role);
  }

  async removeMember(tenantId: string, userId: string) {
    await this.tenantsRepo.removeMember(tenantId, userId);
  }
}