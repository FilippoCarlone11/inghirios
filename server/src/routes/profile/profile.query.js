import { pool } from '../../db.js';

export async function elenco() {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, email, telefono, ruolo, attivo
     FROM persone ORDER BY cognome, nome`
  );
  return rows;
}

export async function elencoRunners() {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, email, telefono, ruolo, attivo
     FROM persone WHERE ruolo = 'runner' ORDER BY cognome, nome`
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

export async function trovaPerID(id) {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, ruolo, password_hash, attivo
     FROM persone WHERE id = $1`,
    [id]
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

export async function crea({ username, passwordHash, nome, cognome, email, telefono, ruolo}) {
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

export async function updateLiberatoria({liberatoria_consegnata, id}){
  const{rows} = await pool.query(
   `
      UPDATE giurati 
      SET liberatoria_consegnata = $1 
      WHERE id_utente = $2 
      RETURNING *;
    `,
    [liberatoria_consegnata, id]
  )
  return rows;

}


export async function deletePersona(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM persone WHERE id = $1',
    [id]
  );
  
  return rowCount > 0; 
}

export async function eliminaAccompagnatore(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM accompagnatori WHERE id = $1',
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

export async function trovaGiuratoPerIDutente(id_utente){
  
  const { rows } = await pool.query(
    `SELECT 
      tipo_giuria, liberatoria_consegnata, partecipazione, 
      emittente, mezzo_di_informazione, partecipa_in_questa_edizione
    FROM giurati 
    WHERE id_utente = $1`,
    [id_utente]
  );
  return rows;

}


export async function creaAccompagnatore({ nome, cognome, id_accompagnatore }){
  const {rows} = await pool.query(
    'INSERT INTO accompagnatori (id_accompagnatore, nome, cognome) VALUES ($1, $2, $3) RETURNING *',
    [id_accompagnatore, nome, cognome]
  );
  return rows[0];
}

export async function numeroAccompagnatori({id_utente }){
  const {rows} = await pool.query(
    'SELECT COUNT(*) FROM accompagnatori WHERE id_accompagnatore = $1 RETURNING *',
    [id_utente]
  );
  return rows[0];
}


export async function elencoAccompagnatori() {
  const query = `
    SELECT 
      a.id AS id_accompagnatore,
      a.nome AS nome_accompagnatore, 
      a.cognome AS cognome_accompagnatore, 
      p.nome AS nome_persona, 
      p.cognome AS cognome_persona,
      p.id AS id_persona 
    FROM accompagnatori a 
    JOIN persone p ON a.id_accompagnatore = p.id
  `;
  
  const { rows } = await pool.query(query);
  
  return rows;
}

export async function elencoAccompagnatoriPerIDPersona(id_persona) {
  const { rows } = await pool.query(`
    SELECT
      nome AS nome_accompagnatore, 
      cognome AS cognome_accompagnatore 
    FROM accompagnatori 
    WHERE id_accompagnatore = $1
  `,[id_persona]);

  
  return rows;
}


export async function creaMembroOspite({ id_capo_gruppo, nome, cognome }) {
  const { rows } = await pool.query(
    `INSERT INTO membri_ospiti (id_capo_gruppo, nome, cognome)
     VALUES ($1, $2, $3)
     RETURNING id, id_capo_gruppo, nome, cognome`,
    [id_capo_gruppo, nome, cognome]
  );
  return rows[0];
}



export async function elencaMembroOspitePerCapoGruppoID({ id_capo_gruppo }) {
  const { rows } = await pool.query(
    `SELECT  nome, cognome
    FROM membri_ospiti
    WHERE id_capo_gruppo = $1`,
    [id_capo_gruppo]
  );
  return rows;
}



export async function elencoOspiti() {
  const { rows } = await pool.query(
    `SELECT 
      p.id, p.nome, p.cognome, p.username, p.email, p.telefono,
      COALESCE(
        json_agg(
          json_build_object('id', m.id, 'nome', m.nome, 'cognome', m.cognome)
        ) FILTER (WHERE m.id IS NOT NULL), '[]'
      ) as membri
     FROM persone p
     LEFT JOIN membri_ospiti m ON p.id = m.id_capo_gruppo
     WHERE p.ruolo = 'ospite'
     GROUP BY p.id
     ORDER BY p.cognome, p.nome`
  );
  return rows;
}
