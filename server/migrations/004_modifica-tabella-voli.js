export const up = (pgm) => {
  // Aggiungiamo le nuove colonne alla tabella 'biglietti'
  pgm.addColumn('biglietti', {
    partenza: { type: 'text', notNull: true, default: 'Da definire' },
    arrivo: { type: 'text', notNull: true, default: 'Da definire' },
    orario_partenza_previsto: { type: 'timestamp' },
    orario_arrivo_previsto: { type: 'timestamp' },
    orario_partenza_confermato: { type: 'timestamp' },
    orario_arrivo_confermato: { type: 'timestamp' }
  });
};

export const down = (pgm) => {
  // Rimuoviamo tutte le colonne appena aggiunte
  pgm.dropColumns('biglietti', [
    'partenza', 
    'arrivo', 
    'orario_partenza_previsto', 
    'orario_arrivo_previsto', 
    'orario_partenza_confermato', 
    'orario_arrivo_confermato'
  ]);
};