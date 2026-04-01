import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BoardsRepository } from './boards.repository';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';

@Module({
  imports: [DatabaseModule],
  providers: [BoardsRepository, BoardsService],
  controllers: [BoardsController],
  exports: [BoardsRepository],
})
export class BoardsModule {}