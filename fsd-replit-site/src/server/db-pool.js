import { Pool } from 'pg';

export function createDatabasePool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}
