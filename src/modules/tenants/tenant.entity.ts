import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserTenant } from '../users/user-tenant.entity';

@Entity({ name: 'tenants', schema: 'public' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @OneToMany(() => UserTenant, (ut) => ut.tenant)
  userTenants: UserTenant[];
}