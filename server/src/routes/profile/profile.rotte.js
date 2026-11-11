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
  elencoAccompagnatori, eliminaAccompagnatore, elencoOspiti, creaMembroOspite,
  trovaPerID, trovaGiuratoPerIDutente, elencoAccompagnatoriPerIDPersona, 
  elencaMembroOspitePerCapoGruppoID, deleteGiurato, elencoTuttiMembriOspiti, modificaGiurato,
  modificaAccountPersona, modificaAccompagnatore, modificaOspiteLeader, eliminaMembroOspite, 
  trovaPerUsername, rubricaCompleta, trovaAltriRimborsiPerUtenteID,
  aggiornaStatoAltroRimborso, aggiungiAltroRimborso, riepilogoRimborsi
} from './profile.query.js';

import { trovaAlloggioPerUtenteID } from '../alloggi/alloggi.query.js'; 
import { trovaBigliettiPerUtenteID } from '../biglietti/biglietti.query.js'; 

const router = Router();

// ==========================================
// SEZIONE 1: ROTTE STATICHE (GET)
// ==========================================

router.get('/elenco-persone', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elenco());
});

router.get('/riepilogo-rimborsi', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    res.json(await riepilogoRimborsi());
  } catch (err) {
    next(err);
  }
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

router.get('/elenco-membri-ospiti', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoTuttiMembriOspiti());
});

router.get('/rubrica', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    res.json(await rubricaCompleta());
  } catch (err) {
    next(err);
  }
});


// ==========================================
// SEZIONE 2: ROTTE STATICHE (POST) 
// (Aggiunte, Creazioni e Nuovi Rimborsi)
// ==========================================

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

router.post('/aggiungi-accompagnatore', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const nome = String(req.body.nome ?? '').trim();
    const cognome = String(req.body.cognome ?? '').trim();
    const id_persona = Number(req.body.id_persona); 

    if (!nome || !cognome) throw new ErroreHttp(400, 'Nome e cognome sono obbligatori');
    if (!id_persona) throw new ErroreHttp(400, 'Devi selezionare un utente');

    const esistePersona = await trovaAttivaPerId(id_persona);
    if (!esistePersona) throw new ErroreHttp(400, 'Non esiste l\'utente a cui associare l\'accompagnatore');
   
    const nuovoAccompagnatore = await creaAccompagnatore({ nome, cognome, id_persona });
    
    res.status(201).json(nuovoAccompagnatore); 
  } catch (err) {
    next(err); 
  }
});

router.post('/aggiungi-ospite-gruppo', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { leader, membri } = req.body;
    if (!leader) throw new ErroreHttp(400, 'Dati dell\'ospite principale mancanti');

    leader.ruolo = 'ospite'; 
    const accountGruppo = await creaPersonaBase(leader);
    const membriCreati = [];

    if (membri && Array.isArray(membri)) {
      for (const membro of membri) {
        if (membro.nome && membro.cognome) { 
          const membroCreato = await creaMembroOspite({
            id_gruppo: accountGruppo.id,
            nome: String(membro.nome).trim(),
            cognome: String(membro.cognome).trim()
          });
          membriCreati.push(membroCreato);
        }
      }
    }

    res.status(201).json({ leader: accountGruppo, membri: membriCreati });
  } catch (err) {
    next(err);
  }
});

// Aggiunta spesa extra (ora posizionata prima delle rotte dinamiche!)
router.post('/aggiungi-altro-rimborso', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id_selezionato, descrizione, importo, id_utente_principale } = req.body;
    if (!importo || !id_utente_principale) return res.status(400).json({ error: "Dati mancanti" });

    // Gestione assegnazione utente/accompagnatore/membro
    let id_utente = null, id_accompagnatore = null, id_membro_ospite = null;
    const idNum = Number(id_selezionato.substring(2));
    
    if (id_selezionato.startsWith('p_')) id_utente = idNum;
    else if (id_selezionato.startsWith('a_')) id_accompagnatore = idNum;
    else if (id_selezionato.startsWith('m_')) id_membro_ospite = idNum;

    if (!id_utente) id_utente = id_utente_principale;

    const nuovoRimborso = await aggiungiAltroRimborso({
      id_utente, id_accompagnatore, id_membro_ospite, descrizione, importo: Number(importo)
    });

    res.status(201).json(nuovoRimborso);
  } catch (err) {
    next(err);
  }
});


// ==========================================
// SEZIONE 3: ROTTE CON PARAMETRI SPECIFICI (PUT / DELETE / PATCH)
// (Modifiche mirate su specifiche entità)
// ==========================================

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

router.put('/modifica-giurato/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id } = req.params;
    const dati = req.body;

    if (!id) {
      throw new ErroreHttp(400, 'ID giurato mancante');
    }

    const giuratoAggiornato = await modificaGiurato(Number(id), dati);
    res.status(200).json(giuratoAggiornato);
  } catch (err) {
    next(err);
  }
});

router.put('/modifica-accompagnatore/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, cognome, id_persona } = req.body;

    if (!id) throw new ErroreHttp(400, 'ID accompagnatore mancante');
    if (!nome || !cognome) throw new ErroreHttp(400, 'Nome e cognome sono obbligatori');
    if (!id_persona) throw new ErroreHttp(400, 'Devi selezionare un utente associato');

    const accompagnatoreAggiornato = await modificaAccompagnatore(Number(id), { nome, cognome, id_persona });
    if (!accompagnatoreAggiornato) throw new ErroreHttp(404, 'Accompagnatore non trovato');
    
    res.status(200).json(accompagnatoreAggiornato);
  } catch (err) {
    next(err);
  }
});

router.put('/modifica-ospite-gruppo/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { leader, membri } = req.body; 

    if (!id) throw new ErroreHttp(400, 'ID leader mancante');
    if (!leader) throw new ErroreHttp(400, 'Dati leader mancanti');

    const leaderAggiornato = await modificaOspiteLeader(Number(id), leader);
    
    res.status(200).json({ leader: leaderAggiornato, messaggio: 'Leader aggiornato' });
  } catch (err) {
    next(err);
  }
});

router.put('/modifica-persona/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) throw new ErroreHttp(400, 'ID non valido');

    const { nome, cognome, email, telefono } = req.body;
    if (!nome || !cognome) throw new ErroreHttp(400, 'Nome e cognome sono obbligatori');

    const personaAggiornata = await modificaPersona(id, {
      nome: nome.trim(),
      cognome: cognome.trim(),
      email: email ? email.trim().toLowerCase() : null,
      telefono: telefono ? telefono.trim() : null
    }); 

    if (!personaAggiornata) throw new ErroreHttp(404, 'Utente non trovato');
    
    res.status(200).json(personaAggiornata);
  } catch (err) {
    console.error("ERRORE MODIFICA PERSONA:", err);
    next(err);
  }
});

router.put('/numero-accompagnatori/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_persona = Number(req.params.id);

    if (!id_persona) {
      throw new ErroreHttp(400, 'ID mancante o non valido');
    }
    
    const result = await numeroAccompagnatori(id_persona);
    res.status(200).json({ totale: result ? Number(result.totale) : 0 });

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

router.delete('/elimina-membro-ospite/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new ErroreHttp(400, 'ID membro mancante');

    const eliminato = await eliminaMembroOspite(Number(id));
    if (!eliminato) throw new ErroreHttp(404, 'Membro non trovato');

    res.status(200).json({ success: true, message: 'Membro eliminato' });
  } catch (err) {
    next(err);
  }
});

// Modifica stato spesa extra (ora posizionata prima delle rotte dinamiche generalizzate!)
router.patch('/cambia-stato-rimborso/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const rimborsato = Boolean(req.body.rimborsato);
    
    if (!id) return res.status(400).json({ error: "ID mancante" });

    const aggiornato = await aggiornaStatoAltroRimborso(id, rimborsato);
    if (!aggiornato) return res.status(404).json({ error: "Rimborso non trovato" });

    res.json({ success: true, rimborsato: aggiornato.rimborsato });
  } catch (err) {
    next(err);
  }
});


// ==========================================
// SEZIONE 4: FUNZIONI HELPER
// ==========================================
async function creaPersonaBase(dati) {
  const username = String(dati.username ?? '').trim().toLowerCase();
  const nome = String(dati.nome ?? '').trim();
  const cognome = String(dati.cognome ?? '').trim();
  const email = String(dati.email ?? '').trim().toLowerCase() || null;
  const telefono = String(dati.telefono ?? '').trim() || null;
  const ruolo = String(dati.ruolo ?? '');
  const password = String(dati.password ?? '');

  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    throw new ErroreHttp(400, 'Lo username deve avere da 3 a 50 caratteri: lettere, numeri, punto, trattino o underscore');
  }
  if (!nome || !cognome) throw new ErroreHttp(400, 'Nome e cognome sono obbligatori');
  if (!ELENCO_RUOLI.includes(ruolo)) throw new ErroreHttp(400, 'Ruolo non valido');
  if (password.length < 8) throw new ErroreHttp(400, 'La password deve avere almeno 8 caratteri');
  if (email && !email.includes('@')) throw new ErroreHttp(400, 'Email non valida');

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    return await crea({ 
      username, passwordHash, nome, cognome, email, telefono, ruolo,
    });
  } catch (err) {
    if (err.code === '23505') {
      const campo = err.constraint?.includes('email') ? 'email' : 'username';
      throw new ErroreHttp(409, `Esiste già una persona con questo ${campo}`);
    }
    throw err;
  }
}

// ==========================================
// SEZIONE 5: ROTTE DINAMICHE GENERALIZZATE 
// ==========================================

// GET singolo profilo (es. /profile/mariorossi)
router.get('/:username', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { username } = req.params;

    const datiPersonali = await trovaPerUsername(username);

    if (!datiPersonali) {
      throw new ErroreHttp(404, 'Utente non trovato');
    }

    const id_utente = datiPersonali.id;

    let datiGiurato = null;
    let membriGruppo = null;

    if (datiPersonali.ruolo === RUOLI.GIURATO) {
      datiGiurato = await trovaGiuratoPerIDutente(id_utente);
    } else if (datiPersonali.ruolo === RUOLI.OSPITE) {
      membriGruppo = await elencaMembroOspitePerCapoGruppoID(id_utente);
    }

    const accompagnatori = await elencoAccompagnatoriPerIDPersona(id_utente);
    const alloggio = await trovaAlloggioPerUtenteID(id_utente);
    const biglietti = await trovaBigliettiPerUtenteID(id_utente);
    const altri_rimborsi = await trovaAltriRimborsiPerUtenteID(id_utente);

    res.status(200).json({ 
      datiPersonali,
      datiGiurato,
      membriGruppo,
      accompagnatori,
      alloggio,
      biglietti,
      altri_rimborsi
    });

  } catch (err) {
    console.error("ERRORE RECUPERO PROFILO COMPLETO:", err); 
    next(err); 
  }
});

// DELETE generale utente
router.delete('/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_utente = Number(req.params.id);
    if (!id_utente) throw new ErroreHttp(400, 'ID non valido');

    const persona = await trovaPerID(id_utente);
    if(persona.ruolo == RUOLI.GIURATO){
      await deleteGiurato(id_utente);
    }

    await deletePersona(id_utente); 
    
    res.status(200).json({ messaggio: 'Utente eliminato con successo' });
  } catch (err) {
    next(err);
  }
});

// PUT generico Account Staff / Runner
router.put('/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id } = req.params;
    const dati = req.body;

    if (!id) throw new ErroreHttp(400, 'ID utente mancante');

    const utenteAggiornato = await modificaAccountPersona(Number(id), dati);
    res.status(200).json(utenteAggiornato);
  } catch (err) {
    next(err);
  }
});

export default router;