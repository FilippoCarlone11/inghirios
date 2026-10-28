export const up = (pgm) => {
    pgm.addColumns('alloggio', {
        orario_checkin_standard: { type: 'varchar(5)', default: '14:00' },
        orario_checkout_standard: { type: 'varchar(5)', default: '10:00' }
    });
};

export const down = (pgm) => {
    pgm.dropColumns('alloggio', ['orario_checkin_standard', 'orario_checkout_standard']);
};