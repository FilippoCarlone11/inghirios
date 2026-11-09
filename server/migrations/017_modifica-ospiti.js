export const up = (pgm) => {
    // 1. Rinomina la colonna in membri_ospiti per coerenza
    pgm.renameColumn('membri_ospiti', 'id_capo_gruppo', 'id_gruppo');

    // 2. Aggiungi la colonna id_membro_ospite a occupazione_alloggio
    pgm.addColumn('occupazione_alloggio', {
        id_membro_ospite: {
            type: 'integer',
            notNull: false,
            references: 'membri_ospiti',
            onDelete: 'CASCADE'
        }
    });

    // 3. Rimuovi il vecchio check (quello che controllava solo persona o accompagnatore)
    pgm.dropConstraint('occupazione_alloggio', 'check_persona_o_accompagnatore');

    // 4. Aggiungi il nuovo check a 3 vie: uno e uno solo tra i tre tipi di ospite deve essere presente
    pgm.addConstraint('occupazione_alloggio', 'check_assegnatario_singolo', {
        check: `
            (id_persona IS NOT NULL AND id_accompagnatore IS NULL AND id_membro_ospite IS NULL) OR 
            (id_persona IS NULL AND id_accompagnatore IS NOT NULL AND id_membro_ospite IS NULL) OR 
            (id_persona IS NULL AND id_accompagnatore IS NULL AND id_membro_ospite IS NOT NULL)
        `
    });

    // 5. Aggiungi il vincolo di unicità per evitare che lo stesso membro prenoti due camere diverse la stessa notte
    pgm.addConstraint('occupazione_alloggio', 'unique_camera_membro_data', {
        unique: ['id_camera', 'id_membro_ospite', 'data']
    });
};

export const down = (pgm) => {
    // Rollback esatto di questa singola migrazione
    pgm.dropConstraint('occupazione_alloggio', 'unique_camera_membro_data');
    pgm.dropConstraint('occupazione_alloggio', 'check_assegnatario_singolo');
    
    // Ripristino del vecchio check a 2 vie
    pgm.addConstraint('occupazione_alloggio', 'check_persona_o_accompagnatore', {
        check: '(id_persona IS NOT NULL AND id_accompagnatore IS NULL) OR (id_persona IS NULL AND id_accompagnatore IS NOT NULL)'
    });
    
    pgm.dropColumn('occupazione_alloggio', 'id_membro_ospite');
    pgm.renameColumn('membri_ospiti', 'id_gruppo', 'id_capo_gruppo');
};