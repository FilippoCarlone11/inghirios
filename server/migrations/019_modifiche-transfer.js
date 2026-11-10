/* eslint-disable camelcase */

// Piano transfer: gruppi, accompagnatori/ospiti come passeggeri,
// transfer senza biglietto, luoghi predefiniti.

export const up = (pgm) => {
  // 1. transfer: gruppi e nuovi tipi di passeggero
  pgm.addColumns('transfer', {
    id_gruppo: { type: 'uuid' },
    id_accompagnatore: { type: 'integer', references: 'accompagnatori', onDelete: 'CASCADE' },
    id_membro_ospite: { type: 'integer', references: 'membri_ospiti', onDelete: 'CASCADE' }
  });

  // I transfer "extra" non hanno un biglietto
  pgm.alterColumn('transfer', 'id_biglietto', { notNull: false });

  pgm.createIndex('transfer', 'id_gruppo', { name: 'idx_transfer_gruppo' });

  // 2. luoghi predefiniti (i B&B restano nella tabella "alloggio")
  pgm.createTable('luogo_transfer', {
    id: 'id',
    tipo: { type: 'text', notNull: true, default: 'altro', check: "tipo IN ('aeroporto', 'altro')" },
    nome: { type: 'text', notNull: true },
    indirizzo: { type: 'text' },
    latitudine: { type: 'numeric(9,6)' },
    longitudine: { type: 'numeric(9,6)' }
  });

  pgm.sql('CREATE UNIQUE INDEX uq_luogo_transfer_nome ON luogo_transfer (LOWER(nome));');

  // Verifica indirizzo e coordinate prima di andare in produzione
  pgm.sql(`
    INSERT INTO luogo_transfer (tipo, nome, indirizzo, latitudine, longitudine)
    VALUES ('aeroporto', 'Aeroporto di Cagliari',
            'Aeroporto di Cagliari-Elmas, Via dei Trasvolatori, 09030 Elmas CA',
            39.251500, 9.054300);
  `);

  // 3. coordinate degli alloggi (per la mappa, possono restare NULL)
  pgm.addColumns('alloggio', {
    latitudine: { type: 'numeric(9,6)' },
    longitudine: { type: 'numeric(9,6)' }
  });
};

export const down = (pgm) => {
  pgm.dropColumns('alloggio', ['latitudine', 'longitudine']);

  pgm.dropTable('luogo_transfer');

  // Per tornare a id_biglietto NOT NULL e a un solo tipo di passeggero
  // vanno eliminati i transfer che il vecchio schema non sa rappresentare:
  // quelli senza biglietto e quelli per accompagnatori/ospiti.
  pgm.sql(`
    DELETE FROM transfer
    WHERE id_biglietto IS NULL
       OR id_accompagnatore IS NOT NULL
       OR id_membro_ospite IS NOT NULL;
  `);
  pgm.alterColumn('transfer', 'id_biglietto', { notNull: true });

  pgm.dropIndex('transfer', 'id_gruppo', { name: 'idx_transfer_gruppo' });
  pgm.dropColumns('transfer', ['id_gruppo', 'id_accompagnatore', 'id_membro_ospite']);
};