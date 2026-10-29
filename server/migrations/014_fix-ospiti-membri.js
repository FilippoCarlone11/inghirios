export const up = (pgm) => {
    pgm.dropColumns('persone', ['capo_gruppo', 'id_capogruppo']);

    pgm.createTable('membri_ospiti', {
        id : 'id',
        id_capo_gruppo: {
            type: 'integer',
            notNull: true,
            references: 'persone',
            onDelete: 'CASCADE'
        },
        nome: { type: 'varchar(100)', notNull: false }, 
        cognome: { type: 'varchar(100)', notNull: false }, 
    });

};

export const down = (pgm) => {

    pgm.addColumns('persone', {
        capo_gruppo: { type: 'boolean', default: false, notNull: false  },
        id_capogruppo: {
            type: 'integer',
            notNull: false,
            references: 'persone',
            onDelete: 'CASCADE'
        },
    });
    pgm.dropTable('membri_ospiti');
};