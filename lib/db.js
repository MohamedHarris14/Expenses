// SERVER-ONLY. All database access happens here (or through this module).
// The browser never talks to PostgreSQL directly.
//
// @vercel/postgres's default `sql`/`db` exports auto-detect Vercel's
// standard POSTGRES_URL env var. This app instead uses DATABASE_URL (per
// the project's env var convention), so we wire the connection string up
// explicitly with createPool.

import { createPool } from "@vercel/postgres";

const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

// Tagged-template usage for static queries:
//   const { rows } = await sql`SELECT * FROM expenses WHERE id = ${id}`;
export const sql = pool.sql;

/**
 * Run a parameterized query built from dynamic SQL text (used when the
 * WHERE clause is assembled conditionally, e.g. combined expense filters).
 * Always use positional placeholders ($1, $2, ...) and pass values in
 * `params` — never concatenate user input into `text`.
 */
export async function queryRaw(text, params = []) {
  return pool.query(text, params);
}
