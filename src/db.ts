import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const db: Database.Database = new Database('app.db');

const schemaPath = path.resolve(process.cwd(), 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema);