import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const [username, password, nome, cognome] = process.argv.slice(2);

if (!username || !password || !nome || !cognome) {
  console.error('Uso: node scripts/crea-admin.js username password nome cognome');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
await pool.query(
  `INSERT INTO persone (username, password_hash, nome, cognome, ruolo)
   VALUES ($1, $2, $3, $4, 'admin')`,
  [username.trim().toLowerCase(), hash, nome, cognome]
);

console.log(`Admin creato: ${username}`);
await pool.end();