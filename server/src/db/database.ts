import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sql = postgres(env.DATABASE_URL, {
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDatabase(): Promise<void> {
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'
  `;
  if (tables.length === 0) {
    const candidates = [
      path.join(__dirname, 'schema.sql'),
      path.join(__dirname, '../../src/db/schema.sql'),
      path.join(__dirname, '../../server/src/db/schema.sql'),
    ];
    const schemaPath = candidates.find((p) => fs.existsSync(p));
    if (!schemaPath) throw new Error('schema.sql not found');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Execute the schema SQL
    await sql.unsafe(schema);
  }
  
  // Ensure lessons_completed column exists in user_progress
  const columns = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'user_progress' AND column_name = 'lessons_completed'
  `;
  if (columns.length === 0) {
    try {
      await sql`ALTER TABLE user_progress ADD COLUMN lessons_completed INTEGER DEFAULT 0`;
    } catch {
      /* column already exists */
    }
  }

  // Import and run seeding
  const { seedIfEmpty } = await import('./seed.js');
  await seedIfEmpty();
}

export default sql;
