import { pool } from '../../db.js';

// ==========================================
// SEZIONE 1: ELENCHI GENERALI E RICERCHE PERSONE
// ==========================================

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

// ==========================================
// SEZIONE 2: CREAZIONE E GESTIONE PASSWORD
// ==========================================

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

// ==========================================
// SEZIONE 3: GIURATI
// ==========================================

export async function aggiungiAGiurato({ id_utente, tipo_giuria, liberatoria_consegnata, partecipazione, emittente, mezzo_di_informazione, partecipa_in_questa_edizione }){
  const {rows} = await pool.query(
    'INSERT INTO giurati (id_utente, tipo_giuria, liberatoria_consegnata, partecipazione, emittente, mezzo_di_informazione, partecipa_in_questa_edizione) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, id_utente, tipo_giuria, liberatoria_consegnata, partecipazione, emittente, mezzo_di_informazione, partecipa_in_questa_edizione',
    [id_utente, tipo_giuria, liberatoria_consegnata, partecipazione, emittente, mezzo_di_informazione, partecipa_in_questa_edizione]
  );
  return rows[0];
}

export async function updateLiberatoria({liberatoria_consegnata, id}){
  const{rows} = await pool.query(
   `UPDATE giurati 
    SET liberatoria_consegnata = $1 
    WHERE id_utente = $2 
    RETURNING *;`,
    [liberatoria_consegnata, id]
  );
  return rows;
}

export async function modificaGiurato(id, {tipo_giudice, tipo_partecipazione, emittente, mezzo_di_informazione} ){
  const{rows} = await pool.query(
     `UPDATE giurati 
      SET tipo_giuria = $1, partecipazione = $2, emittente = $3, mezzo_di_informazione = $4 
      WHERE id_utente = $5`,
     [tipo_giudice, tipo_partecipazione, emittente, mezzo_di_informazione, id]
   );
  return rows;
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
  return rows[0];
}

// ==========================================
// SEZIONE 4: ACCOMPAGNATORI E OSPITI GRUPPO
// ==========================================

export async function creaAccompagnatore({ nome, cognome, id_persona }){
  const {rows} = await pool.query(
    'INSERT INTO accompagnatori (id_persona, nome, cognome) VALUES ($1, $2, $3) RETURNING *',
    [id_persona, nome, cognome]
  );
  return rows[0];
}

export async function numeroAccompagnatori(id_persona){
  const {rows} = await pool.query(
    'SELECT COUNT(*) AS totale FROM accompagnatori WHERE id_persona = $1',
    [id_persona]
  );
  return rows[0];
}

export async function elencoAccompagnatori() {
  const query = `
    SELECT 
      a.id,
      a.nome AS nome_accompagnatore, 
      a.cognome AS cognome_accompagnatore, 
      a.id_persona,
      p.nome AS nome_persona, 
      p.cognome AS cognome_persona
    FROM accompagnatori a 
    JOIN persone p ON a.id_persona = p.id
  `;
  const { rows } = await pool.query(query);
  return rows;
}

export async function elencoAccompagnatoriPerIDPersona(id_persona) {
  const { rows } = await pool.query(`
    SELECT id, nome, cognome 
    FROM accompagnatori 
    WHERE id_persona = $1
  `,[id_persona]);
  return rows;
}

export async function creaMembroOspite({ id_gruppo, nome, cognome }) {
  const { rows } = await pool.query(
    `INSERT INTO membri_ospiti (id_gruppo, nome, cognome)
     VALUES ($1, $2, $3)
     RETURNING id, id_gruppo, nome, cognome`,
    [id_gruppo, nome, cognome]
  );
  return rows[0];
}

export async function elencaMembroOspitePerCapoGruppoID(id_gruppo) {
  const { rows } = await pool.query(
    `SELECT id, nome, cognome
    FROM membri_ospiti
    WHERE id_gruppo = $1`,
    [id_gruppo]
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
     LEFT JOIN membri_ospiti m ON p.id = m.id_gruppo
     WHERE p.ruolo = 'ospite'
     GROUP BY p.id
     ORDER BY p.cognome, p.nome`
  );
  return rows;
}

export async function elencoTuttiMembriOspiti() {
  const { rows } = await pool.query(`
    SELECT m.id, m.id_gruppo, m.nome, m.cognome, p.nome AS nome_gruppo, p.cognome AS cognome_gruppo
    FROM membri_ospiti m
    JOIN persone p ON m.id_gruppo = p.id
    ORDER BY p.cognome, m.cognome
  `);
  return rows;
}

// ==========================================
// SEZIONE 5: MODIFICHE ACCOUNT E GENERALI
// ==========================================

export async function modificaAccountPersona(id, dati) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if (dati.password) {
      const hash = await bcrypt.hash(dati.password, 10);
      await client.query(
        `UPDATE persone 
         SET username = $1, nome = $2, cognome = $3, email = $4, telefono = $5, ruolo = $6, password_hash = $7 
         WHERE id = $8`,
        [dati.username, dati.nome, dati.cognome, dati.email, dati.telefono, dati.ruolo, hash, id]
      );
    } else {
      await client.query(
        `UPDATE persone 
         SET username = $1, nome = $2, cognome = $3, email = $4, telefono = $5, ruolo = $6 
         WHERE id = $7`,
        [dati.username, dati.nome, dati.cognome, dati.email, dati.telefono, dati.ruolo, id]
      );
    }

    await client.query('COMMIT');
    return { id, ...dati };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function modificaAccompagnatore(id, { nome, cognome, id_persona }) {
  const { rows } = await pool.query(
    `UPDATE accompagnatori 
     SET nome = $1, cognome = $2, id_persona = $3 
     WHERE id = $4 
     RETURNING *`,
    [nome, cognome, id_persona, id]
  );
  return rows[0];
}

export async function modificaOspiteLeader(id, dati) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if (dati.password) {
      const hash = await bcrypt.hash(dati.password, 10);
      await client.query(
        `UPDATE persone 
         SET username = $1, nome = $2, cognome = $3, email = $4, telefono = $5, password_hash = $6 
         WHERE id = $7 AND ruolo = 'ospite'`,
        [dati.username, dati.nome, dati.cognome, dati.email, dati.telefono, hash, id]
      );
    } else {
      await client.query(
        `UPDATE persone 
         SET username = $1, nome = $2, cognome = $3, email = $4, telefono = $5 
         WHERE id = $6 AND ruolo = 'ospite'`,
        [dati.username, dati.nome, dati.cognome, dati.email, dati.telefono, id]
      );
    }

    await client.query('COMMIT');
    return { id, ...dati };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rubricaCompleta() {
  const { rows } = await pool.query(`
    SELECT username, nome, cognome
    FROM persone
    UNION ALL
    SELECT p.username, a.nome, a.cognome 
    FROM accompagnatori a 
    JOIN persone p ON a.id_persona = p.id
    UNION ALL
    SELECT p.username, m.nome, m.cognome
    FROM membri_ospiti m 
    JOIN persone p ON m.id_gruppo = p.id
    ORDER BY nome, cognome
  `);
  return rows;
}

// ==========================================
// SEZIONE 6: ALTRI RIMBORSI E SPESE EXTRA
// ==========================================

export async function trovaAltriRimborsiPerUtenteID(id_utente) {
  // CORREZIONE APPLICATA: COALESCE dà priorità ad accompagnatore e membro ospite. 
  // Prima se un accompagnatore aveva una spesa, ma id_utente era valorizzato col leader, 
  // la query mostrava sempre il nome del leader ignorando l'accompagnatore.
  const query = `
    SELECT ar.*,
           COALESCE(a.nome, m.nome, p.nome) AS nome_passeggero,
           COALESCE(a.cognome, m.cognome, p.cognome) AS cognome_passeggero
    FROM altri_rimborsi ar
    LEFT JOIN persone p ON ar.id_utente = p.id
    LEFT JOIN accompagnatori a ON ar.id_accompagnatore = a.id
    LEFT JOIN membri_ospiti m ON ar.id_membro_ospite = m.id
    WHERE ar.id_utente = $1
       OR ar.id_accompagnatore IN (SELECT id FROM accompagnatori WHERE id_persona = $1)
       OR ar.id_membro_ospite IN (SELECT id FROM membri_ospiti WHERE id_gruppo = $1)
    ORDER BY ar.id ASC;
  `;
  const { rows } = await pool.query(query, [id_utente]);
  return rows;
}

export async function aggiornaStatoAltroRimborso(id, rimborsato) {
  const query = `UPDATE altri_rimborsi SET rimborsato = $1 WHERE id = $2 RETURNING *`;
  const { rows } = await pool.query(query, [rimborsato, id]);
  return rows[0];
}

export async function aggiungiAltroRimborso(dati) {
  const query = `
    INSERT INTO altri_rimborsi (id_utente, id_accompagnatore, id_membro_ospite, descrizione, importo, rimborsato)
    VALUES ($1, $2, $3, $4, $5, false)
    RETURNING *;
  `;
  const valori = [
    dati.id_utente, 
    dati.id_accompagnatore || null, 
    dati.id_membro_ospite || null, 
    dati.descrizione, 
    dati.importo
  ];
  const { rows } = await pool.query(query, valori);
  return rows[0];
}

// ==========================================
// SEZIONE 7: CANCELLAZIONI (DELETE)
// ==========================================

export async function deletePersona(id) {
  const { rowCount } = await pool.query('DELETE FROM persone WHERE id = $1', [id]);
  return rowCount > 0; 
}

export async function deleteGiurato(id) {
  const { rowCount } = await pool.query('DELETE FROM giurati WHERE id_utente = $1', [id]);
  return rowCount > 0; 
}

export async function eliminaAccompagnatore(id) {
  const { rowCount } = await pool.query('DELETE FROM accompagnatori WHERE id = $1', [id]);
  return rowCount > 0; 
}

export async function eliminaMembroOspite(id) {
  const { rowCount } = await pool.query('DELETE FROM membri_ospiti WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function riepilogoRimborsi() {
  const query = `
    WITH TicketUserMapping AS (
        SELECT b.id, b.costo, b.stato, b.da_rimborsare_ospite,
               COALESCE(b.id_utente, a.id_persona, m.id_gruppo) AS id_utente_principale
        FROM biglietti b
        LEFT JOIN accompagnatori a ON b.id_accompagnatore = a.id
        LEFT JOIN membri_ospiti m ON b.id_membro_ospite = m.id
    ),
    AlloggiUserMapping AS (
        SELECT o.id, c.costo_per_notte, o.da_rimborsare,
               COALESCE(o.id_persona, a.id_persona) AS id_utente_principale
        FROM occupazione_alloggio o
        JOIN camera c ON o.id_camera = c.id
        LEFT JOIN accompagnatori a ON o.id_accompagnatore = a.id
    ),
    ExtraUserMapping AS (
        SELECT ar.id, ar.importo, ar.rimborsato,
               COALESCE(ar.id_utente, a.id_persona, m.id_gruppo) AS id_utente_principale
        FROM altri_rimborsi ar
        LEFT JOIN accompagnatori a ON ar.id_accompagnatore = a.id
        LEFT JOIN membri_ospiti m ON ar.id_membro_ospite = m.id
    ),
    UtentiConTotali AS (
        SELECT 
            p.id, p.username, p.nome, p.cognome, p.ruolo,
            (SELECT COALESCE(SUM(costo), 0) FROM TicketUserMapping WHERE id_utente_principale = p.id AND (stato = 'rimborso_richiesto' OR (da_rimborsare_ospite = true AND stato != 'rimborso_ottenuto'))) +
            (SELECT COALESCE(SUM(costo_per_notte), 0) FROM AlloggiUserMapping WHERE id_utente_principale = p.id AND da_rimborsare = true) +
            (SELECT COALESCE(SUM(importo), 0) FROM ExtraUserMapping WHERE id_utente_principale = p.id AND rimborsato = false) 
            AS totale_da_rimborsare,
            (SELECT COALESCE(SUM(costo), 0) FROM TicketUserMapping WHERE id_utente_principale = p.id AND stato = 'rimborso_ottenuto') +
            (SELECT COALESCE(SUM(importo), 0) FROM ExtraUserMapping WHERE id_utente_principale = p.id AND rimborsato = true) 
            AS totale_completato
        FROM persone p
    )
    SELECT * FROM UtentiConTotali 
    WHERE totale_da_rimborsare > 0 OR totale_completato > 0
    ORDER BY totale_da_rimborsare DESC, cognome ASC, nome ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}