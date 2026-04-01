import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserTenant } from './user-tenant.entity';
import { UsersRepository } from './users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserTenant])],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}