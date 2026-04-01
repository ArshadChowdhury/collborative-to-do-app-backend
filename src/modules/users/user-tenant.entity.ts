import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tenant } from '../tenants/tenant.entity';

@Entity({ name: 'user_tenants', schema: 'public' })
export class UserTenant {
  @PrimaryColumn({ name: 'user_id' })
  user_id: string;

  @PrimaryColumn({ name: 'tenant_id' })
  tenant_id: string;

  @Column({ default: 'member' })
  role: 'owner' | 'admin' | 'member';

  @CreateDateColumn({ name: 'joined_at' })
  joined_at: Date;

  @ManyToOne(() => User, (u) => u.userTenants)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tenant, (t) => t.userTenants)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}