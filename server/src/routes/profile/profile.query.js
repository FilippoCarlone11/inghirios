import { pool } from '../../db.js';

export async function elenco() {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, email, telefono, ruolo, attivo
     FROM persone ORDER BY cognome, nome`
  );
  return rows;
}

export async function trovaAttivaPerId(id) {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, ruolo
     FROM persone WHERE id = $1 AND attivo = true`,
    [id]
  );
  return rows[0];
}

export async function trovaPerUsername(username) {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, ruolo, password_hash, attivo
     FROM persone WHERE username = $1`,
    [username]
  );
  return rows[0];
}

export async function hashPasswordDi(id) {
  const { rows } = await pool.query('SELECT password_hash FROM persone WHERE id = $1', [id]);
  return rows[0]?.password_hash;
}

export async function aggiornaPassword(id, hash) {
  await pool.query('UPDATE persone SET password_hash = $1 WHERE id = $2', [hash, id]);
}

export async function crea({ username, passwordHash, nome, cognome, email, telefono, ruolo }) {
  const { rows } = await pool.query(
    `INSERT INTO persone (username, password_hash, nome, cognome, email, telefono, ruolo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, username, nome, cognome, email, telefono, ruolo, attivo`,
    [username, passwordHash, nome, cognome, email, telefono, ruolo]
  );
  return rows[0];
}