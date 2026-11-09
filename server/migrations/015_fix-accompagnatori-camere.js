export const up = (pgm) => {
    // 1. Rinomina id_accompagnatore in id_persona nella tabella accompagnatori
    pgm.renameColumn('accompagnatori', 'id_accompagnatore', 'id_persona');

    // 2. Modifica occupazione_alloggio per supportare gli accompagnatori
    // Rimuoviamo il vecchio vincolo di unicità che bloccava le modifiche
    pgm.dropConstraint('occupazione_alloggio', 'unique_camera_persona_data');

    // Rendiamo id_persona non più obbligatorio (nullable)
    pgm.alterColumn('occupazione_alloggio', 'id_persona', {
        notNull: false
    });

    // Aggiungiamo la colonna id_accompagnatore
    pgm.addColumn('occupazione_alloggio', {
        id_accompagnatore: {
            type: 'integer',
            notNull: false,
            references: 'accompagnatori',
            onDelete: 'CASCADE'
        }
    });

    // Aggiungiamo un check constraint logico (XOR): 
    // l'occupazione deve essere legata a una persona OPPURE a un accompagnatore.
    pgm.addConstraint('occupazione_alloggio', 'check_persona_o_accompagnatore', {
        check: '(id_persona IS NOT NULL AND id_accompagnatore IS NULL) OR (id_persona IS NULL AND id_accompagnatore IS NOT NULL)'
    });

    // Ricreiamo i vincoli di unicità (uno per evitare doppi booking per la stessa persona, uno per l'accompagnatore)
    pgm.addConstraint('occupazione_alloggio', 'unique_camera_persona_data', {
        unique: ['id_camera', 'id_persona', 'data']
    });
    pgm.addConstraint('occupazione_alloggio', 'unique_camera_accompagnatore_data', {
        unique: ['id_camera', 'id_accompagnatore', 'data']
    });
};

export const down = (pgm) => {
    // Ripristiniamo la tabella occupazione_alloggio
    pgm.dropConstraint('occupazione_alloggio', 'unique_camera_accompagnatore_data');
    pgm.dropConstraint('occupazione_alloggio', 'unique_camera_persona_data');
    pgm.dropConstraint('occupazione_alloggio', 'check_persona_o_accompagnatore');

    pgm.dropColumn('occupazione_alloggio', 'id_accompagnatore');

    // Prima di rimettere NOT NULL su id_persona, eliminiamo le eventuali occupazioni degli accompagnatori
    // che causerebbero un errore ripristinando il vecchio schema
    pgm.sql('DELETE FROM occupazione_alloggio WHERE id_persona IS NULL');

    pgm.alterColumn('occupazione_alloggio', 'id_persona', {
        notNull: true
    });

    // Ripristiniamo il vecchio vincolo di unicità originale
    pgm.addConstraint('occupazione_alloggio', 'unique_camera_persona_data', {
        unique: ['id_camera', 'id_persona', 'data']
    });

    // Ripristiniamo il nome originale della colonna nella tabella accompagnatori
    pgm.renameColumn('accompagnatori', 'id_persona', 'id_accompagnatore');
};