import { pool } from '../../db.js';
import { ErroreHttp } from '../../middleware/errors.js';

// ==========================================
// ELENCO ALLOGGI
// ==========================================
export async function elencoAlloggi() {
  const query = `
    SELECT id, nome, indirizzo
    FROM alloggio ORDER BY nome;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// ==========================================
// CERCA UN SINGOLO ALLOGGIO
// ==========================================
export async function cercaAlloggio(id) {
  const query = `
    SELECT id, nome, indirizzo
    FROM alloggio
    WHERE id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

// ==========================================
// AGGIUNGI ALLOGGIO
// ==========================================
export async function aggiungiAlloggio(dati) {
  const query = `
    INSERT INTO alloggio (nome, indirizzo)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const valori = [dati.nome, dati.indirizzo];
  const { rows } = await pool.query(query, valori);
  return rows[0];
}

// ==========================================
// MODIFICA ALLOGGIO
// ==========================================
export async function modificaAlloggio(id, dati) {
  const query = `
    UPDATE alloggio
    SET nome = $1, indirizzo = $2
    WHERE id = $3
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [dati.nome, dati.indirizzo, id]);
  return rows[0];
}

// ==========================================
// ELIMINA ALLOGGIO
// ==========================================
export async function eliminaAlloggio(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM occupazione_alloggio
       WHERE id_camera IN (SELECT id FROM camera WHERE id_alloggio = $1)`,
      [id]
    );
    await client.query('DELETE FROM camera WHERE id_alloggio = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM alloggio WHERE id = $1', [id]);
    await client.query('COMMIT');
    return rowCount > 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// AGGIUNGI CAMERA
// ==========================================
export async function aggiungiCamera(dati) {
  const query = `
    INSERT INTO camera (id_alloggio, posti_letto, costo_per_notte)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [dati.id_alloggio, dati.posti_letto, dati.costo_per_notte]);
  return rows[0];
}

// ==========================================
// MODIFICA CAMERA
// ==========================================
export async function modificaCamera(id, dati) {
  const { rows: [r] } = await pool.query(
    `SELECT COALESCE(MAX(n), 0)::int AS max_occupati FROM (
       SELECT COUNT(*) AS n FROM occupazione_alloggio WHERE id_camera = $1 GROUP BY data
     ) t`,
    [id]
  );

  if (dati.posti_letto < r.max_occupati) {
    throw new ErroreHttp(409, `Ci sono notti con ${r.max_occupati} persone: i posti letto non possono scendere sotto questo numero`);
  }

  const { rows } = await pool.query(
    `UPDATE camera SET posti_letto = $1, costo_per_notte = $2 WHERE id = $3 RETURNING *;`,
    [dati.posti_letto, dati.costo_per_notte, id]
  );
  return rows[0];
}

// ==========================================
// ELENCO CAMERE
// ==========================================
export async function elencoCamereAlloggio(id_alloggio) {
  const query = `
    SELECT id, id_alloggio, posti_letto, costo_per_notte
    FROM camera WHERE id_alloggio = $1 ORDER BY id;
  `;
  const { rows } = await pool.query(query, [id_alloggio]);
  return rows;
}

// ==========================================
// ELENCO OCCUPAZIONI (Join per Persone OPPURE Accompagnatori)
// ==========================================
export async function elencoOccupazioniAlloggio(id_alloggio) {
  const query = `
    SELECT
      o.id, o.id_camera, o.id_persona, o.id_accompagnatore, o.data,
      o.da_rimborsare,
      COALESCE(p.nome, a.nome) AS nome_persona, 
      COALESCE(p.cognome, a.cognome) AS cognome_persona
    FROM occupazione_alloggio o
    JOIN camera c ON o.id_camera = c.id
    LEFT JOIN persone p ON o.id_persona = p.id
    LEFT JOIN accompagnatori a ON o.id_accompagnatore = a.id
    WHERE c.id_alloggio = $1
    ORDER BY o.data ASC, COALESCE(p.cognome, a.cognome) ASC;
  `;
  const { rows } = await pool.query(query, [id_alloggio]);
  return rows;
}

// ==========================================
// AGGIUNGI OCCUPAZIONI
// ==========================================
// ==========================================
// AGGIUNGI OCCUPAZIONI (Con auto-flag rimborsi per accompagnatori)
// ==========================================
export async function aggiungiOccupazioni({ id_camera, id_persona, id_accompagnatore, date }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: camere } = await client.query(
      'SELECT posti_letto FROM camera WHERE id = $1 FOR UPDATE',
      [id_camera]
    );
    if (camere.length === 0) throw new ErroreHttp(404, 'Camera non trovata');
    
    const posti = camere[0].posti_letto;

    const { rows: piene } = await client.query(
      `SELECT to_char(data, 'YYYY-MM-DD') AS data
       FROM occupazione_alloggio
       WHERE id_camera = $1 AND data = ANY($2::date[])
       GROUP BY data HAVING COUNT(*) >= $3 ORDER BY data`,
      [id_camera, date, posti]
    );
    
    if (piene.length > 0) {
      throw new ErroreHttp(409, `Camera piena (${posti} posti) nelle notti: ${piene.map((r) => r.data).join(', ')}`);
    }

    const { rows } = await client.query(
      `WITH nuove AS (
         INSERT INTO occupazione_alloggio (id_camera, id_persona, id_accompagnatore, data, da_rimborsare)
         -- Se id_accompagnatore ($3) non è nullo, setta da_rimborsare a true automaticamente
         SELECT $1, $2, $3, d, CASE WHEN $3::int IS NOT NULL THEN true ELSE false END
         FROM unnest($4::date[]) AS d
         RETURNING *
       )
       SELECT
         n.id, n.id_camera, n.id_persona, n.id_accompagnatore, n.data,
         n.da_rimborsare,
         COALESCE(p.nome, a.nome) AS nome_persona, 
         COALESCE(p.cognome, a.cognome) AS cognome_persona
       FROM nuove n
       LEFT JOIN persone p ON n.id_persona = p.id
       LEFT JOIN accompagnatori a ON n.id_accompagnatore = a.id
       ORDER BY n.data;`,
      [id_camera, id_persona || null, id_accompagnatore || null, date]
    );

    await client.query('COMMIT');
    return rows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// TROVA ALLOGGIO (Prende stanze della persona E dei suoi accompagnatori)
// ==========================================
export async function trovaAlloggioPerUtenteID(id_persona) {
  const query = `
    SELECT
      a.id AS id_alloggio,
      a.nome AS nome_alloggio,
      a.indirizzo,
      c.id AS id_camera,
      c.posti_letto,
      o.id AS id_occupazione,
      o.data,
      o.id_persona,
      o.id_accompagnatore
    FROM occupazione_alloggio o
    JOIN camera c ON o.id_camera = c.id
    JOIN alloggio a ON c.id_alloggio = a.id
    WHERE o.id_persona = $1 
       OR o.id_accompagnatore IN (SELECT id FROM accompagnatori WHERE id_persona = $1)
    ORDER BY o.data ASC;
  `;
  const { rows } = await pool.query(query, [id_persona]);
  return rows;
}

// ==========================================
// ELIMINA CAMERA
// ==========================================
export async function eliminaCamera(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM occupazione_alloggio WHERE id_camera = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM camera WHERE id = $1', [id]);
    await client.query('COMMIT');
    return rowCount > 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// ELIMINA OCCUPAZIONE
// ==========================================
export async function eliminaOccupazione(id) {
  const query = `DELETE FROM occupazione_alloggio WHERE id = $1;`;
  const { rowCount } = await pool.query(query, [id]);
  return rowCount > 0;
}

// ==========================================
// ELIMINA SOGGIORNO (Gestisce sia id_persona che id_accompagnatore in query dinamica)
// ==========================================
export async function eliminaSoggiorno({ id_camera, id_persona, id_accompagnatore, data_inizio, data_fine }) {
  let query = `DELETE FROM occupazione_alloggio WHERE id_camera = $1 AND data BETWEEN $2 AND $3`;
  let params = [id_camera, data_inizio, data_fine];

  if (id_persona) {
    query += ` AND id_persona = $4`;
    params.push(id_persona);
  } else {
    query += ` AND id_accompagnatore = $4`;
    params.push(id_accompagnatore);
  }

  const { rowCount } = await pool.query(query, params);
  return rowCount > 0;
}

// ==========================================
// AGGIORNA RIMBORSO NOTTE
// ==========================================
export async function aggiornaRimborsoNotte(da_rimborsare, id) {
  const { rows } = await pool.query(
    `UPDATE occupazione_alloggio SET da_rimborsare = $1 WHERE id = $2 RETURNING *`,
    [da_rimborsare, id]
  );
  return rows[0];
}