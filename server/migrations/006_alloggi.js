export const up = (pgm) => {
    pgm.createTable('alloggio', {
        id: 'id',
        nome: { type: 'varchar(100)', notNull: true },
        indirizzo: { type: 'varchar(100)', notNull: true },
    });

    pgm.createTable('camera', {
        id: 'id',
        id_alloggio: {
            type: 'integer',
            notNull: true,
            references: 'alloggio', 
            onDelete: 'CASCADE' 
        },
        posti_letto: { type: 'integer', notNull: true },
        costo_per_notte: { type: 'numeric(10, 2)', notNull: true },
    });

    pgm.createTable('occupazione_alloggio', {
        id: 'id',
        id_camera: {
            type: 'integer',
            notNull: true,
            references: 'camera',
            onDelete: 'CASCADE' 
        },
        id_persona: {
            type: 'integer',
            notNull: true,
            references: 'persone', 
            onDelete: 'CASCADE' 
        },
        data: { type: 'date', notNull: true },
        rimborso_completo: { type: 'boolean', default: false },
        rimborso_50: { type: 'boolean', default: false }
    });

    pgm.addConstraint('occupazione_alloggio', 'unique_camera_persona_data', {
        unique: ['id_camera', 'id_persona', 'data']
    });
};

export const down = (pgm) => {
    // Ordine inverso per evitare errori di Foreign Key
    pgm.dropTable('occupazione_alloggio');
    pgm.dropTable('camera');
    pgm.dropTable('alloggio');
};