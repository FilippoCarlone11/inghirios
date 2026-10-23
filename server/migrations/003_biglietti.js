export const up = (pgm) => {
    // Corretto 'in ritardo' in 'in_ritardo'
    pgm.createType('stato_biglietto', ['comprato', 'in_ritardo', 'arrivato', 'cancellato', 'rimborso_richiesto', 'rimborso_ottenuto'])
    
    pgm.createType('compagnie', [
    // --- TRENI ---
    'trenitalia', 'italo', 'trenord',
    // --- AEREI ---
    'ita_airways', 'ryanair', 'easyjet', 'wizz_air', 'volotea', 'vueling', 
    'lufthansa', 'air_france', 'klm', 'british_airways', 'emirates', 
    'qatar_airways', 'american_airlines', 'delta',
    // --- TRAGHETTI / NAVI ---
    'grimaldi_lines', 'moby', 'tirrenia', 'gnv', 'corsica_ferries',
    // --- OPZIONI GENERICHE ---
    'altra_compagnia', 'nessuna'
    ]);

    pgm.createTable('biglietti', {
        id : 'id',
        id_utente: {
            type: 'integer',
            notNull: true,
            references: 'persone',
            onDelete: 'CASCADE'
        },
        codice_prenotazione: { type: 'varchar(100)', notNull: false },
        codice_volo: { type: 'varchar(100)', notNull: false }, 
        codice_treno: { type: 'varchar(100)', notNull: false }, 
        compagnia: { type: 'compagnie', notNull: true },
        stato: { type: 'stato_biglietto', notNull: true },
        costo: { type: 'numeric(10, 2)', notNull: true },
        da_rimborsare_ospite: { type: 'boolean', default: false }
    });
};

export const down = (pgm) => {
    pgm.dropTable('biglietti');
    pgm.dropType('compagnie');
    pgm.dropType('stato_biglietto');
}