import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
  tenants?: Array<{ id: string; slug: string; name: string; role: string }>;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.query<User>(
      `SELECT u.*, 
         json_agg(
           json_build_object('id', t.id, 'slug', t.slug, 'name', t.name, 'role', ut.role)
         ) FILTER (WHERE t.id IS NOT NULL) AS tenants
       FROM public.users u
       LEFT JOIN public.user_tenants ut ON ut.user_id = u.id
       LEFT JOIN public.tenants t ON t.id = ut.tenant_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.query<User>(
      `SELECT u.*,
         json_agg(
           json_build_object('id', t.id, 'slug', t.slug, 'name', t.name, 'role', ut.role)
         ) FILTER (WHERE t.id IS NOT NULL) AS tenants
       FROM public.users u
       LEFT JOIN public.user_tenants ut ON ut.user_id = u.id
       LEFT JOIN public.tenants t ON t.id = ut.tenant_id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email],
    );
    return rows[0] ?? null;
  }

  async create(data: {
    email: string;
    password_hash: string;
    display_name: string;
  }): Promise<User> {
    const rows = await this.db.query<User>(
      `INSERT INTO public.users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.email, data.password_hash, data.display_name],
    );
    return { ...rows[0], tenants: [] };
  }
}