import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenant = request.tenant;

    if (!tenant) throw new ForbiddenException('Tenant not found');

    const belongs = user?.userTenants?.some((ut: any) => ut.tenant?.id === tenant.id);
    if (!belongs) throw new ForbiddenException('Access denied to this tenant');

    return true;
  }
}