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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { User } from '../users/users.repository';
import type { Tenant } from '../tenants/tenants.repository';
import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto } from './dto/todos.dto';

@Controller('boards/:boardId/todos')
@UseGuards(TenantGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(
    @CurrentTenant() tenant: Tenant,
    @Param('boardId') boardId: string,
  ) {
    return this.todosService.findByBoard(tenant.slug, boardId);
  }

  @Get(':id')
  findOne(
    @CurrentTenant() tenant: Tenant,
    @Param('boardId') boardId: string,
    @Param('id') id: string,
  ) {
    return this.todosService.findOne(tenant.slug, boardId, id);
  }

  @Post()
  create(
    @CurrentTenant() tenant: Tenant,
    @Param('boardId') boardId: string,
    @Body() dto: CreateTodoDto,
    @CurrentUser() user: User,
  ) {
    return this.todosService.create(tenant.slug, boardId, dto, user.id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenant: Tenant,
    @Param('boardId') boardId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todosService.update(tenant.slug, boardId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentTenant() tenant: Tenant,
    @Param('boardId') boardId: string,
    @Param('id') id: string,
  ) {
    return this.todosService.remove(tenant.slug, boardId, id);
  }
}