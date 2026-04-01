import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

type TodoStatus = 'todo' | 'in-progress' | 'done';

export class CreateTodoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(['todo', 'in-progress', 'done'])
  status?: TodoStatus;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(['todo', 'in-progress', 'done'])
  status?: TodoStatus;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;
}