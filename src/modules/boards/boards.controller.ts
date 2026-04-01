import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { Tenant } from '../tenants/tenants.repository';
import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto } from './dto/boards.dto';

@Controller('boards')
@UseGuards(TenantGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.boardsService.findAll(tenant.slug);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.boardsService.findOne(tenant.slug, id);
  }

  @Post()
  create(@CurrentTenant() tenant: Tenant, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(tenant.slug, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.update(tenant.slug, id, dto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.boardsService.remove(tenant.slug, id);
  }
}