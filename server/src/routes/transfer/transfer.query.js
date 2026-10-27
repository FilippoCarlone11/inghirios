import { pool } from '../../db.js';

export async function elencoTransferRegistrati() {
  const query = `
    SELECT 
      t.id,
      t.id_biglietto, 
      t.orario_pickup, 
      t.luogo_pickup, 
      t.luogo_destinazione, 
      t.visibile_al_runner,
      p.id AS id_persona, p.nome AS nome_persona, p.cognome AS cognome_persona,
      r.id AS id_runner, r.nome AS nome_runner, r.cognome AS cognome_runner
    FROM transfer t
    LEFT JOIN persone p ON t.id_persona_da_trasferire = p.id 
    LEFT JOIN persone r ON t.id_runner = r.id
    ORDER BY t.orario_pickup ASC NULLS LAST
  `;
  
  const { rows } = await pool.query(query);
  return rows;
}


export async function aggiungiTransfer(dati) {
    const query = `
      INSERT INTO transfer (
        id_biglietto, 
        id_runner, 
        id_persona_da_trasferire, 
        orario_pickup, 
        luogo_pickup, 
        luogo_destinazione, 
        visibile_al_runner
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const valori = [
      dati.id_biglietto, 
      dati.id_runner || null, 
      dati.id_persona_da_trasferire || null, 
      dati.orario_pickup || null, 
      dati.luogo_pickup || null, 
      dati.luogo_destinazione, 
      dati.visibile_al_runner || false
    ];
    
    const { rows } = await pool.query(query, valori);
    return rows[0];
}

export async function modificaTransfer(id, dati) {
  const query = `
    WITH updated AS (
      UPDATE transfer 
      SET 
        id_runner = $1,
        id_persona_da_trasferire = $2,
        orario_pickup = $3,
        luogo_pickup = $4,
        luogo_destinazione = $5,
        visibile_al_runner = $6
      WHERE id = $7
      RETURNING *
    )
    SELECT 
      t.id,
      t.id_biglietto, 
      t.orario_pickup, 
      t.luogo_pickup, 
      t.luogo_destinazione, 
      t.visibile_al_runner,
      p.id AS id_persona, p.nome AS nome_persona, p.cognome AS cognome_persona,
      r.id AS id_runner, r.nome AS nome_runner, r.cognome AS cognome_runner
    FROM updated t
    LEFT JOIN persone p ON t.id_persona_da_trasferire = p.id 
    LEFT JOIN persone r ON t.id_runner = r.id;
  `;
  
  const valori = [
    dati.id_runner || null, 
    dati.id_persona_da_trasferire || null, 
    dati.orario_pickup || null, 
    dati.luogo_pickup || null, 
    dati.luogo_destinazione, 
    dati.visibile_al_runner || false,
    id // Il 7° parametro è l'ID del transfer da modificare
  ];
  
  const { rows } = await pool.query(query, valori);
  return rows[0]; // Restituisce il transfer aggiornato e formattato
}