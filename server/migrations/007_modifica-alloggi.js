export const up = (pgm) => {
  // Aggiungiamo le nuove colonne alla tabella 'biglietti'
  pgm.addColumn('alloggio', {
    orario_checkin: { type: 'varchar(20)', notNull: true },
    orario_checkout: { type: 'varchar(20)', notNull: true },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('alloggio', [
    'orario_checkin', 
    'orario_checkout', 
  ]);
};