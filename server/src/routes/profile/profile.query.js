import { pool } from '../../db.js';

export async function elenco() {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, email, telefono, ruolo, attivo
     FROM persone ORDER BY cognome, nome`
  );
  return rows;
}



export async function elencoStaffLogistica() {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, email, telefono, ruolo, attivo
     FROM persone WHERE (ruolo = 'admin' OR ruolo = 'logistica' OR ruolo = 'logistica_pro' ) ORDER BY cognome, nome`
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

export async function aggiungiAGiurato({ id_utente, tipo_giuria, liberatoria_consegnata, partecipazione, emittente, mezzo_di_informazione, partecipa_in_questa_edizione }){
  const {rows} = await pool.query(
    'INSERT INTO giurati (id_utente, tipo_giuria, liberatoria_consegnata, partecipazione, emittente, mezzo_di_informazione, partecipa_in_questa_edizione) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, id_utente, tipo_giuria, liberatoria_consegnata, partecipazione, emittente, mezzo_di_informazione, partecipa_in_questa_edizione',
    [id_utente, tipo_giuria, liberatoria_consegnata, partecipazione, emittente, mezzo_di_informazione, partecipa_in_questa_edizione]
  );
  return rows[0];
}

export async function deletePersona(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM persone WHERE id = $1',
    [id]
  );
  
  return rowCount > 0; 
}

export async function elencoGiurati(){
  
  const { rows } = await pool.query(
    `SELECT 
      p.id, p.nome, p.cognome, p.username, p.email, p.telefono, p.ruolo,
      g.tipo_giuria, g.liberatoria_consegnata, g.partecipazione, 
      g.emittente, g.mezzo_di_informazione, g.partecipa_in_questa_edizione
    FROM persone p
    JOIN giurati g ON p.id = g.id_utente
    ORDER BY g.partecipa_in_questa_edizione, p.cognome, p.nome`
  );
  return rows;

}