import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nome TEXT,
      papel TEXT NOT NULL DEFAULT 'parceiro',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS documents (
      collection TEXT NOT NULL,
      id UUID NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (collection, id)
    );

    CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection);

    INSERT INTO documents (collection, id, data)
    VALUES ('settings', '00000000-0000-0000-0000-000000000001', '{"plano":"free"}'::jsonb)
    ON CONFLICT (collection, id) DO NOTHING;
  `);
}
