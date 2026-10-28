export const up = (pgm) => {
    pgm.createTable('accompagnatori', {
        id : 'id',
        id_accompagnatore: {
            type: 'integer',
            notNull: true,
            references: 'persone',
            onDelete: 'CASCADE'
        },
        nome: {type: 'varchar(100)', notNull: false},
        cognome: {type: 'varchar(100)', notNull: false},
    });

};

export const down = (pgm) => {
    pgm.dropTable('accompagnatori');
}