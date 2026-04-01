import { Module } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
  providers: [TenantsRepository, TenantsService],
  controllers: [TenantsController],
  exports: [TenantsRepository, TenantsService],
})
export class TenantsModule {}