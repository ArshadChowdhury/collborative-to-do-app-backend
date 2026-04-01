import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { User } from '../users/users.repository';
import type { Tenant } from './tenants.repository';
import { TenantsService } from './tenants.service';
import { AddMemberDto, CreateTenantDto } from './dto/tenants.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: User) {
    return this.tenantsService.create(dto, user.id);
  }

  @Get('current')
  @UseGuards(TenantGuard)
  getCurrent(@CurrentTenant() tenant: Tenant) {
    return tenant;
  }

  @Get('current/members')
  @UseGuards(TenantGuard)
  getMembers(@CurrentTenant() tenant: Tenant) {
    return this.tenantsService.getMembers(tenant.id);
  }

  @Post('current/members')
  @UseGuards(TenantGuard)
  addMember(@CurrentTenant() tenant: Tenant, @Body() dto: AddMemberDto) {
    return this.tenantsService.addMember(tenant.id, dto.userId, dto.role);
  }

  @Delete('current/members/:userId')
  @UseGuards(TenantGuard)
  removeMember(
    @CurrentTenant() tenant: Tenant,
    @Param('userId') userId: string,
  ) {
    return this.tenantsService.removeMember(tenant.id, userId);
  }
}