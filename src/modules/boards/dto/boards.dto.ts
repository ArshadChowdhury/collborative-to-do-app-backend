import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}