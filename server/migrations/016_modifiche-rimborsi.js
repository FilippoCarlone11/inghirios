export const up = (pgm) => {
    // 1. Aggiungiamo la nuova colonna
    pgm.addColumn('occupazione_alloggio', {
        da_rimborsare: { type: 'boolean', default: false }
    });

    // 2. Trasferiamo i dati esistenti: se era rimborsato al 100 o 50, ora è da rimborsare
    pgm.sql('UPDATE occupazione_alloggio SET da_rimborsare = true WHERE rimborso_completo = true OR rimborso_50 = true');

    // 3. Eliminiamo le vecchie colonne
    pgm.dropColumns('occupazione_alloggio', ['rimborso_completo', 'rimborso_50']);
};

export const down = (pgm) => {
    // 1. Ripristiniamo le colonne vecchie
    pgm.addColumns('occupazione_alloggio', {
        rimborso_completo: { type: 'boolean', default: false },
        rimborso_50: { type: 'boolean', default: false }
    });

    // 2. Riportiamo i dati indietro (tutto come 100%)
    pgm.sql('UPDATE occupazione_alloggio SET rimborso_completo = true WHERE da_rimborsare = true');

    // 3. Eliminiamo la colonna nuova
    pgm.dropColumn('occupazione_alloggio', 'da_rimborsare');
};