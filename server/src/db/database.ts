import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultDbPath = path.join(process.cwd(), 'data', 'knowyourscales.db');
const tempDbPath = path.join(os.tmpdir(), 'knowyourscales.db');
const candidateDbPath = process.env.DATABASE_PATH || defaultDbPath;

function ensureWritableDbPath(filePath: string): string {
  const dir = path.dirname(filePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return filePath;
  } catch {
    return tempDbPath;
  }
}

let dbPath = ensureWritableDbPath(candidateDbPath);
function createDatabase(pathToUse: string): DatabaseSync {
  try {
    return new DatabaseSync(pathToUse);
  } catch (error) {
    if (pathToUse !== tempDbPath) {
      console.warn(`Unable to open database at ${pathToUse}, falling back to ${tempDbPath}.`, error);
      return createDatabase(tempDbPath);
    }
    throw error;
  }
}
if (dbPath !== candidateDbPath) {
  console.warn(`Falling back to writable database path: ${dbPath}`);
}

const db = createDatabase(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

export function initDatabase(): void {
  const candidates = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '../../src/db/schema.sql'),
  ];
  const schemaPath = candidates.find((p) => fs.existsSync(p));
  if (!schemaPath) throw new Error('schema.sql not found');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  try {
    db.exec('ALTER TABLE user_progress ADD COLUMN lessons_completed INTEGER DEFAULT 0');
  } catch {
    /* column already exists */
  }
}

export default db;
