import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { UserTenant } from '../../modules/users/user-tenant.entity';
import { User } from '../../modules/users/user.entity';

export { Tenant };

@Injectable()
export class TenantsRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepo: Repository<UserTenant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.tenantRepo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepo.findOne({ where: { slug } });
  }

  async create(data: { name: string; slug: string }): Promise<Tenant> {
    const tenant = this.tenantRepo.create(data);
    return this.tenantRepo.save(tenant);
  }

  async addMember(
    tenantId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' = 'member',
  ): Promise<void> {
    await this.userTenantRepo
      .createQueryBuilder()
      .insert()
      .values({ user_id: userId, tenant_id: tenantId, role })
      .orUpdate(['role'], ['user_id', 'tenant_id'])
      .execute();
  }

  async removeMember(tenantId: string, userId: string): Promise<void> {
    await this.userTenantRepo.delete({ tenant_id: tenantId, user_id: userId });
  }

  async getMembers(tenantId: string) {
    return this.userTenantRepo
      .createQueryBuilder('ut')
      .innerJoinAndSelect('ut.user', 'u')
      .where('ut.tenant_id = :tenantId', { tenantId })
      .select([
        'u.id',
        'u.email',
        'u.display_name',
        'ut.role',
        'ut.joined_at',
      ])
      .getRawMany();
  }
}