export const up = (pgm) => {
    pgm.createType('ruolo', ['admin', 'contabilita', 'logisticaPRO', 'logistica' ,'runner', 'giurato', 'ospite', ''])

    pgm.createTable('persone', {
        id : 'id',
        nome: {type: 'varchar(100)', notNull: true},
        cognome: {type: 'varchar(100)', notNull: true},
        username: {type: 'varchar(100)', notNull: true, unique:true},
        email: {type: 'varchar(100)', notNull: false, unique:true},
        telefono: {type: 'varchar(30)'},
        ruolo: { type: 'ruolo', notNull: true },
        password_hash: { type: 'text', notNull: true },
        attivo: {type:'boolean', notNull: true, default: false},
        creato_il: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },


    });
};

export const down = (pgm) => {
    pgm.dropTable('persone');
    pgm.dropType('ruolo');
}