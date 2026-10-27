import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import { TIPO_GIURIA, ELENCO_RUOLI, RUOLI, TIPO_PARTECIPAZIONE } from '../../ruoli.js';
import { elenco, crea, aggiungiAGiurato, deletePersona, elencoGiurati, elencoStaffLogistica, elencoRunners, updateLiberatoria } from './profile.query.js';

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
      id_utente: persona.id,                 // Corretto: prima era persona_id
      tipo_giuria: tipo_giudice,             // Corretto: prima era tipo_giudice
      liberatoria_consegnata: false,
      partecipazione: tipo_partecipazione,   // Corretto: prima era tipo_partecipazione
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
    }
    catch(errRollback){
      console.error("ERRORE DURANTE IL ROLLBACK:", errRollback); 
    }
    
    // 3. INVIA I DETTAGLI AL CLIENT INVECE DI FARE THROW (Temporaneo per debug)
    res.status(500).json({ 
      errore: "Errore interno", 
      messaggio: err.message, // Questo ti dirà cosa è successo
      dettagli: err.detail || err.stack 
    });
  }
});

router.get('/elenco-giurati', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoGiurati());
});

router.get('/elenco-staff-logistica', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoStaffLogistica());
});

router.get('/elenco-runners', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoRunners());
});



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
    // Ritorna l'oggetto persona creato
    return await crea({ username, passwordHash, nome, cognome, email, telefono, ruolo });
  } catch (err) {
    if (err.code === '23505') {
      const campo = err.constraint?.includes('email') ? 'email' : 'username';
      throw new ErroreHttp(409, `Esiste già una persona con questo ${campo}`);
    }
    throw err; // Rilancia altri errori
  }
}

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
export default router;