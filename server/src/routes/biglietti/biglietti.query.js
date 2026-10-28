import { pool } from '../../db.js';

export async function elencoBiglietti() {
  const { rows } = await pool.query(
    `SELECT b.id, p.nome, p.cognome, b.codice_prenotazione, b.codice_volo, b.codice_treno, b.compagnia, b.stato, b.costo, b.da_rimborsare_ospite
     FROM biglietti b
     JOIN persone p ON b.id_utente = p.id ORDER BY p.cognome, p.nome`
  );
  return rows;
}

export async function aggiungiBiglietto(dati) {
    const query = `
      INSERT INTO biglietti (
        id_utente, 
        codice_prenotazione, 
        codice_volo, 
        codice_treno, 
        compagnia, 
        stato, 
        costo, 
        da_rimborsare_ospite,
        partenza,
        arrivo,
        orario_partenza_previsto,
        orario_arrivo_previsto
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    
    const valori = [
      dati.id_utente, 
      dati.codice_prenotazione, 
      dati.codice_volo, 
      dati.codice_treno, 
      dati.compagnia, 
      dati.stato, 
      dati.costo, 
      dati.da_rimborsare_ospite,
      dati.partenza,
      dati.arrivo,
      dati.orario_partenza_previsto || null,
      dati.orario_arrivo_previsto || null
    ];
    
    const { rows } = await pool.query(query, valori);
    return rows[0];
}
export async function elencoBigliettiDaPerCagliari() {
  const query = `
    SELECT 
      b.id,
      p.id AS id_persona,
      p.nome, 
      p.cognome, 
      b.codice_prenotazione, 
      b.codice_volo, 
      b.codice_treno, 
      b.compagnia, 
      b.stato, 
      b.partenza, 
      b.arrivo,
      b.orario_partenza_previsto, 
      b.orario_arrivo_previsto
    FROM biglietti b
    JOIN persone p ON b.id_utente = p.id 
    WHERE b.partenza = 'CAG' OR b.arrivo = 'CAG'
    ORDER BY b.orario_partenza_previsto ASC NULLS LAST
  `;
  
  const { rows } = await pool.query(query);
  return rows;
}

export async function eliminaBiglietto(id) {
  const query = `DELETE FROM biglietti WHERE id = $1;`;
  const valori = [id];
  const { rowCount } = await pool.query(query, valori);
  
  return rowCount > 0;
}
