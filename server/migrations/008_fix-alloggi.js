export const up = (pgm) => {
    // 1. Rimuove le colonne errate dalla tabella alloggio
    pgm.dropColumns('alloggio', ['orario_checkin', 'orario_checkout']);

    // 2. Le aggiunge alla tabella corretta (occupazione_alloggio)
    pgm.addColumns('occupazione_alloggio', {
        orario_checkin: { type: 'varchar(20)' },
        orario_checkout: { type: 'varchar(20)' }
    });
};

export const down = (pgm) => {
    // Operazione inversa in caso tu debba fare un rollback della migrazione
    pgm.dropColumns('occupazione_alloggio', ['orario_checkin', 'orario_checkout']);

    pgm.addColumns('alloggio', {
        orario_checkin: { type: 'varchar(20)' },
        orario_checkout: { type: 'varchar(20)' }
    });
};