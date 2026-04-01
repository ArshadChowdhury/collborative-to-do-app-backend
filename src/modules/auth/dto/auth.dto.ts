import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName: string;

}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}