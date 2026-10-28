export const up = (pgm) => {
  // Aggiungiamo le nuove colonne alla tabella 'biglietti'
  pgm.addColumn('persone', {
    capo_gruppo: { type: 'boolean', default: false, notNull: false  },
    id_capogruppo: {
            type: 'integer',
            notNull: false,
            references: 'persone',
            onDelete: 'CASCADE'
        },
  });
};

export const down = (pgm) => {
  // Rimuoviamo tutte le colonne appena aggiunte
  pgm.dropColumns('persone', [
    'capo_gruppo', 
    'id_capogruppo', 
  ]);
};