import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Board } from '../boards/board.entity';

export type TodoStatus = 'todo' | 'in-progress' | 'done';

@Entity({ name: 'todos' })
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'board_id' })
  board_id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'todo',
  })
  status: TodoStatus;

  @Column({ name: 'assignee_id', nullable: true, type: 'uuid' })
  assignee_id: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Board, (b) => b.todos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;
}