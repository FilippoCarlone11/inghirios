/* eslint-disable camelcase */

// Colore associato a ogni runner, in esadecimale (#rrggbb).

export const up = (pgm) => {
  pgm.createTable('colore_runner', {
    id_runner: { type: 'integer', primaryKey: true, references: 'persone', onDelete: 'CASCADE' },
    colore: { type: 'text', notNull: true, check: "colore ~ '^#[0-9a-fA-F]{6}$'" }
  });
};

export const down = (pgm) => {
  pgm.dropTable('colore_runner');
};