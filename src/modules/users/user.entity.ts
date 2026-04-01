import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserTenant } from './user-tenant.entity';

@Entity({ name: 'users', schema: 'public' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ name: 'display_name' })
  display_name: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @OneToMany(() => UserTenant, (ut) => ut.user)
  userTenants: UserTenant[];
}