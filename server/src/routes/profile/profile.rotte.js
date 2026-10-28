import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import { TIPO_GIURIA, ELENCO_RUOLI, RUOLI, TIPO_PARTECIPAZIONE } from '../../ruoli.js';


import { 
  elenco, crea, aggiungiAGiurato, deletePersona, elencoGiurati, 
  elencoStaffLogistica, elencoRunners, updateLiberatoria, 
  trovaAttivaPerId, creaAccompagnatore, numeroAccompagnatori, 
  elencoAccompagnatori, eliminaAccompagnatore, elencoOspiti 
} from './profile.query.js';

const router = Router();

router.get('/elenco-persone', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elenco());
});

router.post('/', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  const persona = await creaPersonaBase(req.body);
  res.status(201).json(persona);
});

router.post('/aggiungi-giurato', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  const datiPersona = { ...req.body, ruolo: RUOLI.GIURATO}; 
  const persona = await creaPersonaBase(datiPersona);
  
  const tipo_giudice = String(req.body?.tipo_giudice ?? '').trim().toLowerCase();
  const tipo_partecipazione = String(req.body?.tipo_partecipazione ?? '').trim().toLowerCase();
  const emittente = String(req.body?.emittente ?? '').trim() || null;
  const mezzo_di_informazione = String(req.body?.mezzo_di_informazione ?? '').trim() || null;

  if (!TIPO_GIURIA.includes(tipo_giudice)) {
    throw new ErroreHttp(400, 'Tipologia giudice non valida');
  }
  if (!TIPO_PARTECIPAZIONE.includes(tipo_partecipazione)) {
    throw new ErroreHttp(400, 'Tipologia partecipazione non valida');
  }
  
  try {
    const giurato = await aggiungiAGiurato({
      id_utente: persona.id,
      tipo_giuria: tipo_giudice,
      liberatoria_consegnata: false,
      partecipazione: tipo_partecipazione,
      emittente: emittente,
      mezzo_di_informazione: mezzo_di_informazione,
      partecipa_in_questa_edizione: false
    });

    res.status(201).json({ 
      messaggio: 'Giurato creato con successo',
      persona, 
      giurato 
    });
    
  } catch (err) {
    console.error("ERRORE CREAZIONE GIURATO:", err); 

    try {
      await deletePersona(persona.id);
      console.log("Rollback: Persona eliminata a causa di un errore successivo.");
    } catch(errRollback){
      console.error("ERRORE DURANTE IL ROLLBACK:", errRollback); 
    }
    
    res.status(500).json({ 
      errore: "Errore interno", 
      messaggio: err.message,
      dettagli: err.detail || err.stack 
    });
  }
});

router.post('/aggiungi-ospite', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  const ospite = await creaPersonaBase(req.body);
  res.status(201).json(ospite);
});

router.get('/elenco-giurati', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoGiurati());
});

router.get('/elenco-ospiti', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoOspiti());
});

router.get('/elenco-staff-logistica', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoStaffLogistica());
});

router.get('/elenco-runners', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoRunners());
});

router.get('/elenco-accompagnatori', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoAccompagnatori());
});

// Aggiunto parametro id_capogruppo per gestire i membri subordinati
async function creaPersonaBase(dati, id_capogruppo = null) {
  const username = String(dati.username ?? '').trim().toLowerCase();
  const nome = String(dati.nome ?? '').trim();
  const cognome = String(dati.cognome ?? '').trim();
  const email = String(dati.email ?? '').trim().toLowerCase() || null;
  const telefono = String(dati.telefono ?? '').trim() || null;
  const ruolo = String(dati.ruolo ?? '');
  const password = String(dati.password ?? '');
  
  // Gestione del flag capo_gruppo
  const capo_gruppo = Boolean(dati.capo_gruppo); 

  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    throw new ErroreHttp(400, 'Lo username deve avere da 3 a 50 caratteri: lettere, numeri, punto, trattino o underscore');
  }
  if (!nome || !cognome) throw new ErroreHttp(400, 'Nome e cognome sono obbligatori');
  if (!ELENCO_RUOLI.includes(ruolo)) throw new ErroreHttp(400, 'Ruolo non valido');
  if (password.length < 8) throw new ErroreHttp(400, 'La password deve avere almeno 8 caratteri');
  if (email && !email.includes('@')) throw new ErroreHttp(400, 'Email non valida');

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // Passo i nuovi parametri alla query
    return await crea({ 
      username, passwordHash, nome, cognome, email, telefono, ruolo, 
      capo_gruppo, id_capogruppo 
    });
  } catch (err) {
    if (err.code === '23505') {
      const campo = err.constraint?.includes('email') ? 'email' : 'username';
      throw new ErroreHttp(409, `Esiste già una persona con questo ${campo}`);
    }
    throw err;
  }
}

router.post('/aggiungi-ospite-gruppo', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { leader, membri } = req.body;

    if (!leader) {
      throw new ErroreHttp(400, 'Dati del capo gruppo mancanti');
    }

    // 1. Crea il capo gruppo (non ha id_capogruppo perché è lui il leader)
    leader.ruolo = leader.ruolo || 'ospite'; 
    leader.capo_gruppo = true;
    const leaderCreato = await creaPersonaBase(leader);

    const membriCreati = [];

    // 2. Crea i membri subordinati, associandoli all'ID del leader appena creato
    if (membri && Array.isArray(membri) && membri.length > 0) {
      for (const membro of membri) {
        membro.ruolo = membro.ruolo || 'ospite';
        membro.capo_gruppo = false; // I membri non sono capi gruppo
        
        // Passiamo l'ID del leader come secondo parametro (id_capogruppo)
        const membroCreato = await creaPersonaBase(membro, leaderCreato.id);
        membriCreati.push(membroCreato);
      }
    }

    res.status(201).json({ leader: leaderCreato, membri: membriCreati });
  } catch (err) {
    next(err);
  }
});

router.put('/modifica-liberatoria/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { liberatoria_consegnata } = req.body;
    
    const rows = await updateLiberatoria({ liberatoria_consegnata, id });

    if (rows.length === 0) {
      throw new ErroreHttp(404, 'Giurato non trovato');
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Aggiunto "next" e sistemata la risposta
router.post('/aggiungi-accompagnatore', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const nome = String(req.body.nome ?? '').trim();
    const cognome = String(req.body.cognome ?? '').trim();
    const id_accompagnatore = Number(req.body.id_accompagnatore);

    if (!nome || !cognome) throw new ErroreHttp(400, 'Nome e cognome sono obbligatori');
    if (!id_accompagnatore) throw new ErroreHttp(400, 'Devi selezionare un utente');

    const esisteAccompagnatore = await trovaAttivaPerId(id_accompagnatore);
    if (!esisteAccompagnatore) throw new ErroreHttp(400, 'Non esiste l\'utente a cui associare l\'accompagnatore');
   
    const nuovoAccompagnatore = await creaAccompagnatore({ nome, cognome, id_accompagnatore });
    
    // Invia i dati al client e sblocca il frontend
    res.status(201).json(nuovoAccompagnatore); 
  } catch (err) {
    next(err); 
  }
});

router.put('/numero-accompagnatori/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_accompagnatore = Number(req.params.id);

    if (!id_accompagnatore) {
      throw new ErroreHttp(400, 'ID mancante o non valido');
    }
    
    const accompagnatori = await numeroAccompagnatori(id_accompagnatore);

    if (accompagnatori < 0) {
      throw new ErroreHttp(404, 'Errore con il numero di accompagnatori');
    }

    res.status(200).json({ totale: accompagnatori });

  } catch (err) {
    console.error("ERRORE NUMERO ACCOMPAGNATORI:", err); 
    next(err); 
  }
});

router.delete('/elimina-accompagnatore/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    
    const eliminato = await eliminaAccompagnatore(id);
    
    if (!eliminato) {
      throw new ErroreHttp(404, 'Accompagnatore non trovato');
    }

    res.status(200).json({ success: true, message: 'Eliminato' });
  } catch (err) {
    next(err);
  }
});

export default router;