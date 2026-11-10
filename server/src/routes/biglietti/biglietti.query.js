import { pool } from '../../db.js';

export async function elencoBiglietti() {
  const { rows } = await pool.query(
    `SELECT b.*,
            COALESCE(p.nome, a.nome, m.nome) AS nome,
            COALESCE(p.cognome, a.cognome, m.cognome) AS cognome,
            p.ruolo AS ruolo,
            COALESCE(p.username, tp.username) AS username
     FROM biglietti b
     LEFT JOIN persone p ON b.id_utente = p.id
     LEFT JOIN accompagnatori a ON b.id_accompagnatore = a.id
     LEFT JOIN persone tp ON a.id_persona = tp.id
     LEFT JOIN membri_ospiti m ON b.id_membro_ospite = m.id
     ORDER BY cognome, nome`
  );
  return rows;
}

export async function aggiungiBiglietto(dati) {
    const query = `
      INSERT INTO biglietti (
        id_utente, id_accompagnatore, id_membro_ospite, 
        codice_prenotazione, codice_volo, codice_treno, compagnia, 
        stato, costo, da_rimborsare_ospite, partenza, arrivo, 
        orario_partenza_previsto, orario_arrivo_previsto, file_fattura
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    const valori = [
      dati.id_utente, dati.id_accompagnatore, dati.id_membro_ospite,
      dati.codice_prenotazione, dati.codice_volo, dati.codice_treno, dati.compagnia, 
      dati.stato, dati.costo, dati.da_rimborsare_ospite, dati.partenza, dati.arrivo,
      dati.orario_partenza_previsto || null, dati.orario_arrivo_previsto || null, dati.file_fattura || null
    ];
    const { rows } = await pool.query(query, valori);
    return rows[0];
}

export async function elencoBigliettiDaPerCagliari() {
  // LEFT JOIN: include anche i biglietti di accompagnatori e membri ospiti (prima il JOIN su persone li escludeva).
  // partenza/arrivo normalizzati per non perdere tratte scritte 'cag' o con spazi.
  const query = `
    SELECT
      b.id,
      b.id_utente AS id_persona,
      b.id_accompagnatore,
      b.id_membro_ospite,
      CASE
        WHEN b.id_utente IS NOT NULL THEN 'p_' || b.id_utente
        WHEN b.id_accompagnatore IS NOT NULL THEN 'a_' || b.id_accompagnatore
        WHEN b.id_membro_ospite IS NOT NULL THEN 'm_' || b.id_membro_ospite
      END AS chiave_passeggero,
      COALESCE(p.nome, a.nome, m.nome) AS nome,
      COALESCE(p.cognome, a.cognome, m.cognome) AS cognome,
      a.id_persona AS id_titolare,
      COALESCE(p.username, tp.username) AS username_persona,
      b.codice_prenotazione,
      b.codice_volo,
      b.codice_treno,
      b.compagnia,
      b.stato,
      UPPER(TRIM(b.partenza)) AS partenza,
      UPPER(TRIM(b.arrivo)) AS arrivo,
      b.orario_partenza_previsto,
      b.orario_arrivo_previsto
    FROM biglietti b
    LEFT JOIN persone p ON b.id_utente = p.id
    LEFT JOIN accompagnatori a ON b.id_accompagnatore = a.id
    LEFT JOIN persone tp ON a.id_persona = tp.id
    LEFT JOIN membri_ospiti m ON b.id_membro_ospite = m.id
    WHERE UPPER(TRIM(b.partenza)) = 'CAG' OR UPPER(TRIM(b.arrivo)) = 'CAG'
    ORDER BY COALESCE(b.orario_partenza_previsto, b.orario_arrivo_previsto) ASC NULLS LAST
  `;

  const { rows } = await pool.query(query);
  return rows;
}


export async function modificaBiglietto(id, dati) {
  const query = `
    UPDATE biglietti 
    SET compagnia = $1, stato = $2, costo = $3, partenza = $4, arrivo = $5,
        codice_prenotazione = $6, codice_volo = $7, codice_treno = $8,
        id_utente = $9, id_accompagnatore = $10, id_membro_ospite = $11,
        orario_partenza_previsto = $12, orario_arrivo_previsto = $13
        ${dati.file_fattura ? ', file_fattura = $14' : ''}
    WHERE id = ${dati.file_fattura ? '$15' : '$14'}
    RETURNING *;
  `;
  const valori = [
    dati.compagnia, dati.stato, dati.costo, dati.partenza, dati.arrivo,
    dati.codice_prenotazione, dati.codice_volo, dati.codice_treno,
    dati.id_utente, dati.id_accompagnatore, dati.id_membro_ospite,
    dati.orario_partenza_previsto || null, dati.orario_arrivo_previsto || null
  ];
  if (dati.file_fattura) valori.push(dati.file_fattura);
  valori.push(id);
  const { rows } = await pool.query(query, valori);
  return rows[0];
}

export async function cambiaStatoBiglietto(id, stato) {
  const { rows } = await pool.query(`UPDATE biglietti SET stato = $1 WHERE id = $2 RETURNING *`, [stato, id]);
  return rows[0];
}

export async function eliminaBiglietto(id) {
  const { rowCount } = await pool.query(`DELETE FROM biglietti WHERE id = $1`, [id]);
  return rowCount > 0;
}

export async function trovaBigliettiPerUtenteID(id_utente) {
    const { rows } = await pool.query(`SELECT * FROM biglietti WHERE id_utente = $1;`, [id_utente]);
    return rows;
}