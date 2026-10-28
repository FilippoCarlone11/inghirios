import { pool } from '../../db.js';

// ==========================================
// ELENCO ALLOGGI
// ==========================================
export async function elencoAlloggi() {
  const query = `
    SELECT id, nome, indirizzo, orario_checkin_standard, orario_checkout_standard
    FROM alloggio ORDER BY nome;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// ==========================================
// CERCA UN SINGOLO ALLOGGIO (Serve al router prima di aggiungere una camera)
// ==========================================
export async function cercaAlloggio(id) {
  const query = `
    SELECT id, nome, indirizzo
    FROM alloggio
    WHERE id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0]; // Restituisce l'alloggio o undefined se non esiste
}

// ==========================================
// AGGIUNGI ALLOGGIO
// ==========================================
export async function aggiungiAlloggio(dati) {
    const query = `
      INSERT INTO alloggio (nome, indirizzo, orario_checkin_standard, orario_checkout_standard)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const valori = [
      dati.nome, 
      dati.indirizzo,
      dati.orario_checkin_standard || '14:00',
      dati.orario_checkout_standard || '10:00'
    ];
    const { rows } = await pool.query(query, valori);
    return rows[0];
}

// ==========================================
// MODIFICA ALLOGGIO
// ==========================================
export async function modificaAlloggio(id, dati) {
  const query = `
      UPDATE alloggio 
      SET 
        nome = $1,
        indirizzo = $2
      WHERE id = $3
      RETURNING *;
  `; 
  
  const valori = [
    dati.nome,
    dati.indirizzo, 
    id
  ];
  
  const { rows } = await pool.query(query, valori);
  return rows[0];
}

// ==========================================
// AGGIUNGI CAMERA
// ==========================================
export async function aggiungiCamera(dati) {
  const query = `
    INSERT INTO camera (
      id_alloggio, 
      posti_letto,
      costo_per_notte
    )
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const valori = [
    dati.id_alloggio, 
    dati.posti_letto,
    dati.costo_per_notte
  ];
  
  const { rows } = await pool.query(query, valori);
  return rows[0];
}

// ==========================================
// ELENCO CAMERE DI UN SINGOLO ALLOGGIO
// ==========================================
export async function elencoCamereAlloggio(id_alloggio) {
  const query = `
    SELECT id, id_alloggio, posti_letto, costo_per_notte
    FROM camera
    WHERE id_alloggio = $1
    ORDER BY id;
  `;
  const { rows } = await pool.query(query, [id_alloggio]);
  return rows;
}

// ==========================================
// ELENCO OCCUPAZIONI (Chi dorme dove in un B&B)
// ==========================================
// Aggiungi orario_checkin e checkout alla SELECT
export async function elencoOccupazioniAlloggio(id_alloggio) {
  const query = `
    SELECT 
      o.id, o.id_camera, o.id_persona, o.data, 
      o.orario_checkin, o.orario_checkout,
      o.rimborso_completo, o.rimborso_50,
      p.nome AS nome_persona, p.cognome AS cognome_persona
    FROM occupazione_alloggio o
    JOIN camera c ON o.id_camera = c.id
    JOIN persone p ON o.id_persona = p.id
    WHERE c.id_alloggio = $1
    ORDER BY o.data ASC, p.cognome ASC;
  `;
  const { rows } = await pool.query(query, [id_alloggio]);
  return rows;
}



// ==========================================
// AGGIUNGI OCCUPAZIONE (Assegna persona a camera)
// ==========================================
export async function aggiungiOccupazione(dati) {
  const query = `
    WITH nuova_occupazione AS (
      INSERT INTO occupazione_alloggio (
        id_camera, id_persona, data, orario_checkin, orario_checkout
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    )
    SELECT 
      n.id, n.id_camera, n.id_persona, n.data, 
      n.orario_checkin, n.orario_checkout,
      n.rimborso_completo, n.rimborso_50,
      p.nome AS nome_persona, p.cognome AS cognome_persona
    FROM nuova_occupazione n
    JOIN persone p ON n.id_persona = p.id;
  `;
  
  const valori = [
    dati.id_camera, 
    dati.id_persona, 
    dati.data, 
    dati.orario_checkin, 
    dati.orario_checkout
  ];
  const { rows } = await pool.query(query, valori);
  return rows[0];
}

export async function getRegoleAlloggioByCamera(id_camera) {
  const query = `
    SELECT a.orario_checkin_standard, a.orario_checkout_standard 
    FROM camera c
    JOIN alloggio a ON c.id_alloggio = a.id
    WHERE c.id = $1;
  `;
  const { rows } = await pool.query(query, [id_camera]);
  return rows[0];
}