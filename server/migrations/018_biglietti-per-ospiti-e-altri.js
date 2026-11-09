export const up = (pgm) => {
    // Rendiamo id_utente non più obbligatorio
    pgm.alterColumn('biglietti', 'id_utente', { notNull: false });

    // Aggiungiamo le nuove colonne
    pgm.addColumns('biglietti', {
        id_accompagnatore: { type: 'integer', notNull: false, references: 'accompagnatori', onDelete: 'CASCADE' },
        id_membro_ospite: { type: 'integer', notNull: false, references: 'membri_ospiti', onDelete: 'CASCADE' },
        file_fattura: { type: 'varchar(255)', notNull: false } // Colonna per salvare il nome del file
    });

    // Aggiungiamo il check: il biglietto deve appartenere a UNA SOLA persona
    pgm.addConstraint('biglietti', 'check_assegnatario_singolo_biglietto', {
        check: `
            (id_utente IS NOT NULL AND id_accompagnatore IS NULL AND id_membro_ospite IS NULL) OR 
            (id_utente IS NULL AND id_accompagnatore IS NOT NULL AND id_membro_ospite IS NULL) OR 
            (id_utente IS NULL AND id_accompagnatore IS NULL AND id_membro_ospite IS NOT NULL)
        `
    });
};

export const down = (pgm) => {
    pgm.dropConstraint('biglietti', 'check_assegnatario_singolo_biglietto');
    pgm.dropColumns('biglietti', ['id_accompagnatore', 'id_membro_ospite', 'file_fattura']);
    pgm.sql('DELETE FROM biglietti WHERE id_utente IS NULL');
    pgm.alterColumn('biglietti', 'id_utente', { notNull: true });
};