import { randomUUID } from 'crypto';
import { pool } from '../../db.js';

// Un "transfer" è un gruppo di righe con lo stesso id_gruppo (una riga per passeggero).
// Chiave passeggero: p_<id> persona, a_<id> accompagnatore, m_<id> membro ospite
// (stessa convenzione usata in biglietti.rotte.js).

const SELECT_TRANSFER = `
  SELECT
    t.id,
    t.id_gruppo,
    t.id_biglietto,
    t.orario_pickup,
    t.luogo_pickup,
    t.luogo_destinazione,
    t.visibile_al_runner,
    CASE
      WHEN t.id_persona_da_trasferire IS NOT NULL THEN 'p_' || t.id_persona_da_trasferire
      WHEN t.id_accompagnatore        IS NOT NULL THEN 'a_' || t.id_accompagnatore
      WHEN t.id_membro_ospite         IS NOT NULL THEN 'm_' || t.id_membro_ospite
    END AS chiave_passeggero,
    COALESCE(p.nome, a.nome, m.nome)          AS nome_persona,
    COALESCE(p.cognome, a.cognome, m.cognome) AS cognome_persona,
    p.id AS id_persona,
    COALESCE(p.username, tp.username) AS username_persona,
    r.id AS id_runner, r.nome AS nome_runner, r.cognome AS cognome_runner
  FROM transfer t
  LEFT JOIN persone p        ON t.id_persona_da_trasferire = p.id
  LEFT JOIN accompagnatori a ON t.id_accompagnatore = a.id
  LEFT JOIN persone tp       ON a.id_persona = tp.id
  LEFT JOIN membri_ospiti m  ON t.id_membro_ospite = m.id
  LEFT JOIN persone r        ON t.id_runner = r.id
`;

function parseChiave(chiave) {
  const id = Number(chiave.slice(2));
  return {
    id_persona_da_trasferire: chiave.startsWith('p_') ? id : null,
    id_accompagnatore: chiave.startsWith('a_') ? id : null,
    id_membro_ospite: chiave.startsWith('m_') ? id : null
  };
}

function chiaveRiga(r) {
  if (r.id_persona_da_trasferire) return `p_${r.id_persona_da_trasferire}`;
  if (r.id_accompagnatore) return `a_${r.id_accompagnatore}`;
  if (r.id_membro_ospite) return `m_${r.id_membro_ospite}`;
  return null;
}

export async function elencoTransferRegistrati() {
  const { rows } = await pool.query(`${SELECT_TRANSFER} ORDER BY t.orario_pickup ASC NULLS LAST, t.id`);
  return rows;
}

// Crea o aggiorna un transfer di gruppo.
// - ids_esistenti vuoto  -> crea un nuovo gruppo
// - ids_esistenti pieno  -> aggiorna i dati comuni, toglie i passeggeri rimossi, aggiunge i nuovi
export async function salvaGruppoTransfer({
  ids_esistenti, id_runner, orario_pickup, luogo_pickup,
  luogo_destinazione, visibile_al_runner, passeggeri
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let esistenti = [];
    let id_gruppo = null;
    if (ids_esistenti.length > 0) {
      const { rows } = await client.query(
        `SELECT id, id_gruppo, id_persona_da_trasferire, id_accompagnatore, id_membro_ospite
         FROM transfer WHERE id = ANY($1::int[]) FOR UPDATE`,
        [ids_esistenti]
      );
      esistenti = rows;
      id_gruppo = rows.find((r) => r.id_gruppo)?.id_gruppo || null;
    }
    if (!id_gruppo) id_gruppo = randomUUID();

    const voluti = new Map(passeggeri.map((p) => [p.chiave, p]));
    const presenti = new Set();

    for (const r of esistenti) {
      const chiave = chiaveRiga(r);
      const voluto = voluti.get(chiave);
      if (!voluto) {
        await client.query('DELETE FROM transfer WHERE id = $1', [r.id]);
        continue;
      }
      presenti.add(chiave);
      await client.query(
        `UPDATE transfer SET
           id_gruppo = $1, id_runner = $2, orario_pickup = $3, luogo_pickup = $4,
           luogo_destinazione = $5, visibile_al_runner = $6,
           id_biglietto = COALESCE($7, id_biglietto)
         WHERE id = $8`,
        [id_gruppo, id_runner, orario_pickup, luogo_pickup, luogo_destinazione,
         visibile_al_runner, voluto.id_biglietto || null, r.id]
      );
    }

    for (const [chiave, p] of voluti) {
      if (presenti.has(chiave)) continue;
      const ids = parseChiave(chiave);
      await client.query(
        `INSERT INTO transfer (
           id_gruppo, id_biglietto, id_runner,
           id_persona_da_trasferire, id_accompagnatore, id_membro_ospite,
           orario_pickup, luogo_pickup, luogo_destinazione, visibile_al_runner
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id_gruppo, p.id_biglietto || null, id_runner,
         ids.id_persona_da_trasferire, ids.id_accompagnatore, ids.id_membro_ospite,
         orario_pickup, luogo_pickup, luogo_destinazione, visibile_al_runner]
      );
    }

    await client.query('COMMIT');

    const { rows } = await pool.query(`${SELECT_TRANSFER} WHERE t.id_gruppo = $1 ORDER BY t.id`, [id_gruppo]);
    return rows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Mostra/nasconde al runner un insieme di righe (un gruppo, o tutti i gruppi di un runner)
export async function impostaVisibilita(ids, visibile) {
  const { rowCount } = await pool.query(
    'UPDATE transfer SET visibile_al_runner = $1 WHERE id = ANY($2::int[])',
    [visibile, ids]
  );
  return rowCount;
}

export async function eliminaTransfer(id) {
  const { rowCount } = await pool.query('DELETE FROM transfer WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function eliminaTransferMultipli(ids) {
  const { rowCount } = await pool.query('DELETE FROM transfer WHERE id = ANY($1::int[])', [ids]);
  return rowCount;
}

export async function elencoAccompagnatoriPersona(id_persona) {
  const { rows } = await pool.query(
    'SELECT id, nome, cognome FROM accompagnatori WHERE id_persona = $1 ORDER BY cognome, nome',
    [id_persona]
  );
  return rows;
}

// Tutti i possibili passeggeri per i transfer "extra" e per aggiungere persone a un gruppo
export async function elencoPasseggeri() {
  const { rows } = await pool.query(`
    SELECT 'p_' || p.id AS chiave, 'persona' AS tipo, p.nome, p.cognome, NULL::text AS titolare
    FROM persone p
    UNION ALL
    SELECT 'a_' || a.id, 'accompagnatore', a.nome, a.cognome, tp.nome || ' ' || tp.cognome
    FROM accompagnatori a
    LEFT JOIN persone tp ON a.id_persona = tp.id
    UNION ALL
    SELECT 'm_' || m.id, 'ospite', m.nome, m.cognome, NULL::text
    FROM membri_ospiti m
    ORDER BY cognome, nome
  `);
  return rows;
}

// Luoghi selezionabili: aeroporto + luoghi aggiunti a mano + B&B (tabella alloggio)
export async function elencoLuoghi() {
  const { rows } = await pool.query(`
    SELECT * FROM (
      SELECT 'luogo_' || id AS chiave, tipo, nome, indirizzo,
             latitudine::float8 AS latitudine, longitudine::float8 AS longitudine
      FROM luogo_transfer
      UNION ALL
      SELECT 'alloggio_' || id, 'alloggio', nome, indirizzo,
             latitudine::float8, longitudine::float8
      FROM alloggio
    ) l
    ORDER BY CASE tipo WHEN 'aeroporto' THEN 0 WHEN 'alloggio' THEN 1 ELSE 2 END, nome
  `);
  return rows;
}

export async function aggiungiLuogo({ nome, indirizzo, latitudine, longitudine }) {
  const { rows } = await pool.query(
    `INSERT INTO luogo_transfer (tipo, nome, indirizzo, latitudine, longitudine)
     VALUES ('altro', $1, $2, $3, $4)
     RETURNING 'luogo_' || id AS chiave, tipo, nome, indirizzo,
               latitudine::float8 AS latitudine, longitudine::float8 AS longitudine`,
    [nome, indirizzo || null, latitudine ?? null, longitudine ?? null]
  );
  return rows[0];
}

// Transfer di una persona, compresi quelli dei suoi accompagnatori
export async function elencoTrasfersUtente(id_utente) {
  const { rows } = await pool.query(`
    SELECT
      t.id_biglietto,
      p.nome AS nome_runner,
      p.cognome AS cognome_runner,
      t.id_persona_da_trasferire,
      t.id_accompagnatore,
      t.orario_pickup,
      t.luogo_pickup,
      t.luogo_destinazione
    FROM transfer t
    LEFT JOIN persone p ON t.id_runner = p.id
    WHERE t.id_persona_da_trasferire = $1
       OR t.id_accompagnatore IN (SELECT id FROM accompagnatori WHERE id_persona = $1)
    ORDER BY t.orario_pickup ASC NULLS LAST
  `, [id_utente]);
  return rows;
}

// Colore di ogni runner (esadecimale, es. #3b82f6)
export async function elencoColoriRunner() {
  const { rows } = await pool.query('SELECT id_runner, colore FROM colore_runner');
  return rows;
}

export async function impostaColoreRunner(id_runner, colore) {
  const { rows } = await pool.query(
    `INSERT INTO colore_runner (id_runner, colore) VALUES ($1, $2)
     ON CONFLICT (id_runner) DO UPDATE SET colore = EXCLUDED.colore
     RETURNING id_runner, colore`,
    [id_runner, colore]
  );
  return rows[0];
}