// SERVER-ONLY. All database access happens here (or through this module).
// The browser never talks to PostgreSQL directly.
//
// @vercel/postgres's default `sql`/`db` exports auto-detect Vercel's
// standard POSTGRES_URL env var. This app instead uses DATABASE_URL (per
// the project's env var convention), so we wire the connection string up
// explicitly with createPool.
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or POSTGRES_URL / DATABASE_URL_UNPOOLED — see below
});

export async function queryRaw(text, params = []) {
  return pool.query(text, params);
}
