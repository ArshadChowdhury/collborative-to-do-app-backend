import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserTenant } from './user-tenant.entity';

export { User };

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepo: Repository<UserTenant>,
  ) {}

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