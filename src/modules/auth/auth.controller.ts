import { Body, Controller, Get, HttpCode, HttpStatus, Post, Headers } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
import type { User } from '../users/users.repository';
import { UnauthorizedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  // auth.controller.ts
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Headers('x-tenant-slug') tenantSlug: string,
  ) {
    if (!tenantSlug) throw new UnauthorizedException('Workspace slug is required');
    return this.authService.login(dto, tenantSlug);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    const { password_hash, ...safe } = user;
    return safe;
  }
}