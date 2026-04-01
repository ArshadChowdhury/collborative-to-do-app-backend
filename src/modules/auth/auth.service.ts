import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { TenantsRepository } from '../tenants/tenants.repository';
import { User } from '../users/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly tenantsRepo: TenantsRepository, // ← inject this
    private readonly jwtService: JwtService,
  ) { }

  // auth.service.ts
  async signup(dto: SignupDto) {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    // Auto-generate slug from display name, e.g. "John Doe" → "john_doe_x4k2"
    const baseSlug = dto.displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^-|-$/g, '');
    const tenantSlug = `${baseSlug}_${Math.random().toString(36).slice(2, 6)}`;

    const password_hash = await bcrypt.hash(dto.password, 12);
    // const user = await this.usersRepo.create({
    //   email: dto.email,
    //   password_hash,
    //   display_name: dto.displayName,
    // });

    const user = await this.usersRepo.create({
      email: dto.email,
      password_hash,
      display_name: dto.displayName,
    });
    await this.tenantsRepo.createTenantForUser(user.id, tenantSlug); // ← use tenantsRepo
    const userWithTenant = await this.usersRepo.findById(user.id);


    if (!userWithTenant) throw new Error('User not found after creation');

    const createdTenant = userWithTenant.userTenants[0].tenant;
    return this.buildTokenResponse(userWithTenant, createdTenant);
  }

  async login(dto: LoginDto, tenantSlug: string) {
    const user = await this.usersRepo.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Find the specific tenant the user is trying to log into
    const userTenant = user.userTenants?.find(ut => ut.tenant?.slug === tenantSlug);
    if (!userTenant) throw new UnauthorizedException('Access denied for this workspace');

    return this.buildTokenResponse(user, userTenant.tenant);
  }

  private buildTokenResponse(user: User, tenant: { id: string; slug: string }) {
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
        },
      },
    };
  }

}