import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { User } from './modules/users/user.entity';
import { Tenant } from './modules/tenants/tenant.entity';
import { UserTenant } from './modules/users/user-tenant.entity';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BoardsModule } from './modules/boards/boards.module';
import { TodosModule } from './modules/todos/todos.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Public schema connection — manages User, Tenant, UserTenant
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'todo_app'),
        schema: 'public',
        entities: [User, Tenant, UserTenant],
        synchronize: true,   // auto-creates public schema tables
      }),
    }),
    // provides TenantConnectionService (per-tenant DataSources)
    UsersModule,
    AuthModule,
    TenantsModule,
    BoardsModule,
    TodosModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    TenantMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}