/* eslint-disable camelcase */

// Un transfer si può creare anche senza aver deciso la destinazione.

export const up = (pgm) => {
  pgm.alterColumn('transfer', 'luogo_destinazione', { notNull: false });
};

export const down = (pgm) => {
  pgm.sql("UPDATE transfer SET luogo_destinazione = '' WHERE luogo_destinazione IS NULL;");
  pgm.alterColumn('transfer', 'luogo_destinazione', { notNull: true });
};