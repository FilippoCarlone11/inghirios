export const up = (pgm) => {
    pgm.createType('tipo_giuria', ['critica', 'internazionale', 'tecnica'])
    pgm.createType('tipo_partecipazione', ['in loco', 'da remoto'])
    pgm.createTable('giurati', {
        id : 'id',
        id_utente: {
            type: 'integer',
            notNull: true,
            references: 'persone',
            onDelete: 'CASCADE'
        },
        tipo_giuria: {type: 'tipo_giuria', notNull: true},
        liberatoria_consegnata: {type:'boolean', notNull:true, default:false},
        partecipazione: {type:'tipo_partecipazione', notNull:true},
        emittente: {type: 'varchar(100)', notNull: false},
        mezzo_di_informazione: {type: 'varchar(100)', notNull: false},
        partecipa_in_questa_edizione: {type:'boolean', notNull: true, default: false},

    });

};

export const down = (pgm) => {
    pgm.dropTable('giurati');
    pgm.dropType('tipo_giuria');
}