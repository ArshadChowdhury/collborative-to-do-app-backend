import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
}

@Injectable()
export class TenantsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<Tenant | null> {
    const rows = await this.db.query<Tenant>(
      'SELECT * FROM public.tenants WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const rows = await this.db.query<Tenant>(
      'SELECT * FROM public.tenants WHERE slug = $1',
      [slug],
    );
    return rows[0] ?? null;
  }

  async create(data: { name: string; slug: string }): Promise<Tenant> {
    const rows = await this.db.query<Tenant>(
      'INSERT INTO public.tenants (name, slug) VALUES ($1, $2) RETURNING *',
      [data.name, data.slug],
    );
    return rows[0];
  }

  async addMember(
    tenantId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' = 'member',
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO public.user_tenants (tenant_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = $3`,
      [tenantId, userId, role],
    );
  }

  async removeMember(tenantId: string, userId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM public.user_tenants WHERE tenant_id = $1 AND user_id = $2',
      [tenantId, userId],
    );
  }

  async getMembers(tenantId: string) {
    return this.db.query(
      `SELECT u.id, u.email, u.display_name, ut.role, ut.joined_at
       FROM public.user_tenants ut
       JOIN public.users u ON u.id = ut.user_id
       WHERE ut.tenant_id = $1`,
      [tenantId],
    );
  }
}