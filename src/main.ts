import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';


async function runMigrations() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'todo_app',
  });

  // Resolve migrations dir relative to this file — works in both ts-node (src/) and compiled (dist/)
  const migrationsDir = path.join(__dirname, 'database', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[Migrations] Directory not found: ${migrationsDir} — skipping`);
    await pool.end();
    return;
  }

  const files = fs.readdirSync(migrationsDir).sort().filter((f) => f.endsWith('.sql'));

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
  }

  await pool.end();
}

async function bootstrap() {
  // Load .env before anything else (NestJS ConfigModule also does this, but
  // we need it here for the migration pool that runs before the app starts)
  const dotenv = await import('dotenv');
  dotenv.config();

  try {
    await runMigrations();
  } catch (err) {
    console.error('[DB] Migration failed:', err);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({ origin: '*' });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api/v1`);
}

bootstrap();