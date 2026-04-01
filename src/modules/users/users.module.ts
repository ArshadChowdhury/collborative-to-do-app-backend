import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserTenant } from './user-tenant.entity';
import { UsersRepository } from './users.repository';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserTenant, Tenant])],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}