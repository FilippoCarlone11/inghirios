import { Router } from 'express';

import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import { 
  elencoAlloggi, 
  aggiungiAlloggio, 
  modificaAlloggio, 
  cercaAlloggio, 
  aggiungiCamera,
  aggiungiOccupazione,
  elencoCamereAlloggio, 
  elencoOccupazioniAlloggio,
  trovaAlloggioPerUtenteID
} from './alloggi.query.js';
import { RUOLI } from '../../ruoli.js';

const router = Router();

// ==========================================
// ELENCO ALLOGGI
// ==========================================
router.get('/elenco-alloggi', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoAlloggi());
});

// ==========================================
// AGGIUNGI ALLOGGIO
// ==========================================
router.post('/aggiungi-alloggio', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { nome, indirizzo } = req.body;

    // Controllo obbligatori
    if (!nome || !indirizzo) {
      throw new ErroreHttp(400, "Compila tutti i campi obbligatori (Nome e indirizzo dell'alloggio)");
    }

    const alloggio = await aggiungiAlloggio({
      nome: nome.trim(),
      indirizzo: indirizzo.trim(),
    });

    res.status(201).json(alloggio);

  } catch (err) {
    console.error("ERRORE CREAZIONE ALLOGGIO:", err); 
    next(err); 
  }
});

// ==========================================
// AGGIUNGI CAMERA
// ==========================================
router.post('/aggiungi-camera', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const {
      id_alloggio,
      posti_letto,
      costo_per_notte,
    } = req.body;

    // Controllo obbligatori base per la camera
    if (!id_alloggio || !posti_letto || !costo_per_notte) {
      throw new ErroreHttp(400, 'Compila tutti i campi obbligatori (ID Alloggio, posti letto e costo per notte)');
    }

    // Cerca se l'id alloggio esiste
    const esisteAlloggio = await cercaAlloggio(id_alloggio);
    if(!esisteAlloggio){
      throw new ErroreHttp(404, 'Alloggio non trovato nel database');
    }

    const camera = await aggiungiCamera({
      id_alloggio: Number(id_alloggio),
      posti_letto: Number(posti_letto),
      costo_per_notte: Number(costo_per_notte)
    });

    res.status(201).json(camera);

  } catch (err) {
    console.error("ERRORE CREAZIONE CAMERA:", err); 
    next(err); 
  }
});

// ==========================================
// MODIFICA ALLOGGIO
// ==========================================
router.put('/modifica-alloggio/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_alloggio = Number(req.params.id);
    
    const { nome, indirizzo } = req.body;

    // Controllo obbligatori base
    if (!id_alloggio) {
      throw new ErroreHttp(400, 'ID Alloggio mancante o non valido');
    }
    if (!nome || !indirizzo) {
      throw new ErroreHttp(400, "Il nome e l'indirizzo sono obbligatori");
    }

    const alloggioAggiornato = await modificaAlloggio(id_alloggio, {
      nome: nome.trim(),
      indirizzo: indirizzo.trim(),
    });

    if (!alloggioAggiornato) {
      throw new ErroreHttp(404, 'Alloggio non trovato');
    }

    res.status(200).json(alloggioAggiornato);

  } catch (err) {
    console.error("ERRORE MODIFICA ALLOGGIO:", err); 
    next(err); 
  }
});

// ==========================================
// GET: ELENCO CAMERE DI UN ALLOGGIO
// ==========================================
router.get('/elenco-camere/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_alloggio = Number(req.params.id);
    if (!id_alloggio) {
      throw new ErroreHttp(400, 'ID Alloggio non valido');
    }
    
    const camere = await elencoCamereAlloggio(id_alloggio);
    res.json(camere);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// GET: ELENCO OCCUPAZIONI DI UN ALLOGGIO
// ==========================================
router.get('/elenco-occupazioni/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_alloggio = Number(req.params.id);
    if (!id_alloggio) {
      throw new ErroreHttp(400, 'ID Alloggio non valido');
    }
    
    const occupazioni = await elencoOccupazioniAlloggio(id_alloggio);
    res.json(occupazioni);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// POST: ASSEGNA UNA PERSONA ALLA CAMERA
// ==========================================
router.post('/aggiungi-occupazione', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id_camera, id_persona, data_inizio, data_fine } = req.body;

    if (!id_camera || !id_persona || !data_inizio || !data_fine) {
      throw new ErroreHttp(400, 'I campi Camera, Persona, Data Inizio e Data Fine sono obbligatori');
    }

    let inizio = new Date(data_inizio);
    let fine = new Date(data_fine);
    
    if (fine < inizio) {
      throw new ErroreHttp(400, 'La data di fine non può essere precedente a quella di inizio');
    }

    // CREAZIONE DELL'ARRAY DELLE NOTTI
    const giorniDaPrenotare = [];
    let dataCorrente = new Date(inizio);

    if (inizio.getTime() === fine.getTime()) {
      giorniDaPrenotare.push(dataCorrente.toISOString().split('T')[0]);
    } else {
      while (dataCorrente < fine) {
        giorniDaPrenotare.push(dataCorrente.toISOString().split('T')[0]);
        dataCorrente.setDate(dataCorrente.getDate() + 1);
      }
    }

    // SALVATAGGIO NEL DATABASE RIGA PER RIGA
    const occupazioniAggiunte = [];
    for (const dataSingola of giorniDaPrenotare) {
      try {
        const occupazione = await aggiungiOccupazione({
          id_camera: Number(id_camera),
          id_persona: Number(id_persona),
          data: dataSingola
        });
        occupazioniAggiunte.push(occupazione);
      } catch (err) {
        if (err.code === '23505') {
          throw new ErroreHttp(400, `Attenzione: la persona è già assegnata per la notte del ${dataSingola}!`);
        }
        throw err;
      }
    }

    res.status(201).json(occupazioniAggiunte);

  } catch (err) {
    console.error("ERRORE CREAZIONE OCCUPAZIONE:", err); 
    next(err); 
  }
});

// ==========================================
// GET: RECUPERA ALLOGGIO PER ID UTENTE
// ==========================================
router.get('/alloggi/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_utente = Number(req.params.id);

    if (!id_utente || isNaN(id_utente)) {
      throw new ErroreHttp(400, 'ID utente mancante o non valido');
    }

    const alloggio = await trovaAlloggioPerUtenteID(id_utente);

    if (!alloggio) {
      return res.status(200).json(null); 
    }

    res.status(200).json(alloggio);

  } catch (err) {
    console.error(`ERRORE RECUPERO ALLOGGIO PER UTENTE ${req.params.id}:`, err); 
    next(err); 
  }
});

export default router;