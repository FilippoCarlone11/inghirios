export const up = (pgm) => {
    pgm.createTable('altri_rimborsi', {
        id : 'id',
        id_accompagnatore: { type: 'integer', notNull: false, references: 'accompagnatori', onDelete: 'CASCADE' },
        id_membro_ospite: { type: 'integer', notNull: false, references: 'membri_ospiti', onDelete: 'CASCADE' },
        id_utente: {
            type: 'integer',
            references: 'persone',
            onDelete: 'CASCADE'
        },
        descrizione: {type: 'varchar(200)', notNull: false},
        importo: { type: 'numeric(10, 2)', notNull: true },
        rimborsato: { type: 'boolean', default: false }
    });

    pgm.addColumn('biglietti', {
        rimborsato: { type: 'boolean', default: false }
    });
    pgm.addColumn('occupazione_alloggio', {
        rimborsato: { type: 'boolean', default: false }
    });
};

export const down = (pgm) => {
    pgm.dropTable('altri_rimborsi');
    pgm.dropColumns('biglietti', ['rimborsato']);
    pgm.dropColumns('occupazione_alloggio', ['rimborsato']);
}