import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserTenant } from './user-tenant.entity';
import { Tenant } from '../tenants/tenant.entity'; // adjust path if needed

export { User };

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepo: Repository<UserTenant>,
    @InjectRepository(Tenant)                          // add this
    private readonly tenantRepo: Repository<Tenant>,   // add this
  ) {}

  async createTenantForUser(userId: string, slug: string): Promise<void> {
    // Create the tenant
    const tenant = this.tenantRepo.create({ slug, name: slug });
    await this.tenantRepo.save(tenant);

    // Link user to tenant
    const userTenant = this.userTenantRepo.create({
      user: { id: userId },
      tenant: { id: tenant.id },
      role: 'owner',  // remove if you don't have a role column
    });
    await this.userTenantRepo.save(userTenant);
  }

  async findById(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.userTenants', 'ut')
      .leftJoinAndSelect('ut.tenant', 't')
      .where('u.id = :id', { id })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.userTenants', 'ut')
      .leftJoinAndSelect('ut.tenant', 't')
      .where('u.email = :email', { email })
      .getOne();
  }

  async create(data: {
    email: string;
    password_hash: string;
    display_name: string;
  }): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }
}