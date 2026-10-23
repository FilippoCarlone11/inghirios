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
    INSERT INTO biglietti (id_utente, codice_prenotazione, codice_volo, codice_treno, compagnia, stato, costo, da_rimborsare_ospite)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const valori = [
    dati.id_utente, dati.codice_prenotazione, dati.codice_volo, 
    dati.codice_treno, dati.compagnia, dati.stato, dati.costo, dati.da_rimborsare_ospite
  ];
  
  const { rows } = await pool.query(query, valori);
  return rows[0];
}