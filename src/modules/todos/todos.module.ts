import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { TodosRepository } from './todos.repository';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { TodosGateway } from './todos.gateway';
import { BoardsModule } from '../boards/boards.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DatabaseModule,
    BoardsModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [TodosRepository, TodosService, TodosGateway],
  controllers: [TodosController],
})
export class TodosModule {}