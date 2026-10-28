export const up = (pgm) => {

    pgm.createType('tipologia_rimborso', ['alloggio', 'voli', 'pasti', 'altro'])
    pgm.createTable('rimborsi', {
        id : 'id',
        id_utente: {
            type: 'integer',
            notNull: true,
            references: 'persone',
            onDelete: 'CASCADE'
        },
        importo: { type: 'numeric(10, 2)', notNull: true },
        tipologia: { type: 'tipologia_rimborso', notNull: true },
        note: { type: 'varchar(200)', notNull: false },        
        rimborsato: { type: 'boolean', default: false }
    });
};

export const down = (pgm) => {
    pgm.dropTable('rimborsi');
    pgm.dropType('tipologia_rimborso');
}