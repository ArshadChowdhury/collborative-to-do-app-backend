import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(63)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'slug must be lowercase letters, digits or underscores only',
  })
  slug: string;
}

export class AddMemberDto {
  @IsString()
  email: string;

  @IsString()
  role: 'owner' | 'admin' | 'member';
}