export const up = (pgm) => {
    pgm.createTable('transfer', {
        id: 'id',
        id_biglietto: {
            type: 'integer',
            notNull: true,
            references: 'biglietti',
            onDelete: 'CASCADE' 
        },
        id_runner: {
            type: 'integer',
            notNull: false,
            references: 'persone',
            onDelete: 'SET NULL' 
        },
        id_persona_da_trasferire: {
            type: 'integer',
            notNull: false,
            references: 'persone',
            onDelete: 'SET NULL' 
        },
        orario_pickup: { type: 'timestamp' },
        luogo_pickup: { type: 'varchar(100)', notNull: false },
        luogo_destinazione: { type: 'varchar(100)', notNull: true },
        visibile_al_runner: { type: 'boolean', default: false }
    });
};

export const down = (pgm) => {
    pgm.dropTable('transfer');
};