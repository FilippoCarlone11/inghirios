export const up = (pgm) => {
    // 1. Rimuove le colonne errate dalla tabella alloggio
    pgm.dropColumns('occupazione_alloggio', ['orario_checkin', 'orario_checkout']);

};

export const down = (pgm) => {

    pgm.addColumns('occupazione_alloggio', {
        orario_checkin: { type: 'varchar(20)' },
        orario_checkout: { type: 'varchar(20)' }
    });
};