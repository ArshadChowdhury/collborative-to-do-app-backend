import {
  Injectable,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsRepository } from '../../modules/tenants/tenants.repository';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantsRepo: TenantsRepository) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug = req.headers['x-tenant-slug'] as string;
    if (!slug) return next(); // some routes don't need a tenant

    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) throw new NotFoundException(`Tenant '${slug}' not found`);

    (req as any).tenant = tenant;
    next();
  }
}