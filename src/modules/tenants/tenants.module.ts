import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { UserTenant } from '../users/user-tenant.entity';
import { TenantsRepository } from './tenants.repository';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, UserTenant]), UsersModule],
  providers: [TenantsRepository, TenantsService],
  controllers: [TenantsController],
  exports: [TenantsRepository, TenantsService],
})
export class TenantsModule {}