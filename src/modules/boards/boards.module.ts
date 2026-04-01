import { Module } from '@nestjs/common';
import { BoardsRepository } from './boards.repository';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';

@Module({
  providers: [BoardsRepository, BoardsService],
  controllers: [BoardsController],
  exports: [BoardsRepository],
})
export class BoardsModule {}