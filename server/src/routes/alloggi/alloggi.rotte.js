import { Router } from 'express';

import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import {
  elencoAlloggi,
  aggiungiAlloggio,
  modificaAlloggio,
  eliminaAlloggio,
  cercaAlloggio,
  aggiungiCamera,
  modificaCamera,
  eliminaCamera,
  aggiungiOccupazioni,
  elencoCamereAlloggio,
  elencoOccupazioniAlloggio,
  trovaAlloggioPerUtenteID,
  aggiornaRimborsoNotte,
  eliminaOccupazione,
  eliminaSoggiorno, registroContabileAlloggi
} from './alloggi.query.js';
import { RUOLI } from '../../ruoli.js';

const router = Router();

router.get('/elenco-alloggi', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try { res.json(await elencoAlloggi()); } catch (err) { next(err); }
});

router.post('/aggiungi-alloggio', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { nome, indirizzo } = req.body;
    if (!nome || !indirizzo) throw new ErroreHttp(400, "Compila tutti i campi obbligatori (Nome e indirizzo)");
    
    const alloggio = await aggiungiAlloggio({ nome: nome.trim(), indirizzo: indirizzo.trim() });
    res.status(201).json(alloggio);
  } catch (err) {
    console.error("ERRORE CREAZIONE ALLOGGIO:", err);
    next(err);
  }
});

router.post('/aggiungi-camera', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id_alloggio, posti_letto, costo_per_notte } = req.body;
    if (!id_alloggio || !posti_letto || !costo_per_notte) throw new ErroreHttp(400, 'Compila tutti i campi obbligatori');

    const esisteAlloggio = await cercaAlloggio(id_alloggio);
    if (!esisteAlloggio) throw new ErroreHttp(404, 'Alloggio non trovato nel database');

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

router.put('/modifica-alloggio/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_alloggio = Number(req.params.id);
    const { nome, indirizzo } = req.body;
    if (!id_alloggio) throw new ErroreHttp(400, 'ID Alloggio mancante o non valido');
    if (!nome || !indirizzo) throw new ErroreHttp(400, "Il nome e l'indirizzo sono obbligatori");

    const alloggioAggiornato = await modificaAlloggio(id_alloggio, { nome: nome.trim(), indirizzo: indirizzo.trim() });
    if (!alloggioAggiornato) throw new ErroreHttp(404, 'Alloggio non trovato');

    res.status(200).json(alloggioAggiornato);
  } catch (err) {
    console.error("ERRORE MODIFICA ALLOGGIO:", err);
    next(err);
  }
});

router.put('/modifica-camera/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_camera = Number(req.params.id);
    const posti_letto = Number(req.body.posti_letto);
    const costo_per_notte = Number(req.body.costo_per_notte);

    if (!id_camera) throw new ErroreHttp(400, 'ID Camera mancante o non valido');
    if (!posti_letto || posti_letto < 1 || isNaN(costo_per_notte) || costo_per_notte < 0) throw new ErroreHttp(400, 'Posti letto o costo per notte non validi');

    const camera = await modificaCamera(id_camera, { posti_letto, costo_per_notte });
    if (!camera) throw new ErroreHttp(404, 'Camera non trovata');

    res.status(200).json(camera);
  } catch (err) {
    console.error("ERRORE MODIFICA CAMERA:", err);
    next(err);
  }
});

router.get('/registro-contabile', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    res.json(await registroContabileAlloggi());
  } catch (err) {
    next(err);
  }
});

router.get('/elenco-camere/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_alloggio = Number(req.params.id);
    if (!id_alloggio) throw new ErroreHttp(400, 'ID Alloggio non valido');
    res.json(await elencoCamereAlloggio(id_alloggio));
  } catch (err) { next(err); }
});

router.get('/elenco-occupazioni/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_alloggio = Number(req.params.id);
    if (!id_alloggio) throw new ErroreHttp(400, 'ID Alloggio non valido');
    res.json(await elencoOccupazioniAlloggio(id_alloggio));
  } catch (err) { next(err); }
});

router.post('/aggiungi-occupazione', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id_camera, id_persona, id_accompagnatore, data_inizio, data_fine } = req.body;

    if (!id_camera || (!id_persona && !id_accompagnatore) || !data_inizio || !data_fine) {
      throw new ErroreHttp(400, 'I campi Camera, Ospite (o Accompagnatore), Data Inizio e Data Fine sono obbligatori');
    }

    const cursore = new Date(`${data_inizio}T00:00:00Z`);
    const limite = new Date(`${data_fine}T00:00:00Z`);

    if (isNaN(cursore.getTime()) || isNaN(limite.getTime())) throw new ErroreHttp(400, 'Date non valide');
    if (limite < cursore) throw new ErroreHttp(400, 'La data di fine non può essere precedente a quella di inizio');

    const date = [];
    if (cursore.getTime() === limite.getTime()) {
      date.push(data_inizio);
    } else {
      while (cursore < limite) {
        date.push(cursore.toISOString().slice(0, 10));
        cursore.setUTCDate(cursore.getUTCDate() + 1);
      }
    }

    try {
      const occupazioni = await aggiungiOccupazioni({
        id_camera: Number(id_camera),
        id_persona: id_persona ? Number(id_persona) : null,
        id_accompagnatore: id_accompagnatore ? Number(id_accompagnatore) : null,
        date
      });
      res.status(201).json(occupazioni);
    } catch (err) {
      if (err.code === '23505') {
        throw new ErroreHttp(400, 'Attenzione: la persona o l\'accompagnatore sono già assegnati per una o più notti!');
      }
      throw err;
    }

  } catch (err) {
    console.error("ERRORE CREAZIONE OCCUPAZIONE:", err);
    next(err);
  }
});

router.get('/alloggi/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_utente = Number(req.params.id);
    if (!id_utente || isNaN(id_utente)) throw new ErroreHttp(400, 'ID utente mancante o non valido');

    const alloggio = await trovaAlloggioPerUtenteID(id_utente);
    res.status(200).json(alloggio || null);
  } catch (err) {
    console.error(`ERRORE RECUPERO ALLOGGIO PER UTENTE ${req.params.id}:`, err);
    next(err);
  }
});

router.delete('/elimina-alloggio/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_alloggio = Number(req.params.id);
    if (!id_alloggio) throw new ErroreHttp(400, 'ID Alloggio mancante o non valido');
    
    const alloggioEliminato = await eliminaAlloggio(id_alloggio);
    if (!alloggioEliminato) throw new ErroreHttp(404, 'Alloggio non trovato');

    res.status(200).json({ success: true, message: 'Alloggio eliminato con successo' });
  } catch (err) {
    console.error("ERRORE ELIMINAZIONE ALLOGGIO:", err);
    next(err);
  }
});

router.delete('/elimina-camera/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_camera = Number(req.params.id);
    if (!id_camera) throw new ErroreHttp(400, 'ID Camera mancante o non valido');

    const cameraEliminata = await eliminaCamera(id_camera);
    if (!cameraEliminata) throw new ErroreHttp(404, 'Camera non trovata');

    res.status(200).json({ success: true, message: 'Camera eliminata con successo' });
  } catch (err) {
    console.error("ERRORE ELIMINAZIONE CAMERA:", err);
    next(err);
  }
});

router.delete('/elimina-occupazione/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_occupazione = Number(req.params.id);
    if (!id_occupazione) throw new ErroreHttp(400, 'ID Occupazione mancante o non valido');

    const occupazioneEliminata = await eliminaOccupazione(id_occupazione);
    if (!occupazioneEliminata) throw new ErroreHttp(404, 'Occupazione non trovata');

    res.status(200).json({ success: true, message: 'Occupazione eliminata con successo' });
  } catch (err) {
    console.error("ERRORE ELIMINAZIONE OCCUPAZIONE:", err);
    next(err);
  }
});

router.delete('/elimina-soggiorno', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id_camera, id_persona, id_accompagnatore, data_inizio, data_fine } = req.body;

    if (!id_camera || (!id_persona && !id_accompagnatore) || !data_inizio || !data_fine) {
      throw new ErroreHttp(400, 'Dati del soggiorno incompleti');
    }

    const eliminato = await eliminaSoggiorno({
      id_camera: Number(id_camera),
      id_persona: id_persona ? Number(id_persona) : null,
      id_accompagnatore: id_accompagnatore ? Number(id_accompagnatore) : null,
      data_inizio,
      data_fine
    });

    if (!eliminato) throw new ErroreHttp(404, 'Soggiorno non trovato');

    res.status(200).json({ success: true, message: 'Soggiorno eliminato con successo' });
  } catch (err) {
    console.error("ERRORE ELIMINAZIONE SOGGIORNO:", err);
    next(err);
  }
});

router.patch('/aggiorna-rimborso-notte/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const da_rimborsare = Boolean(req.body.da_rimborsare);

    if (!id) throw new ErroreHttp(400, 'ID occupazione mancante o non valido');

    const aggiornata = await aggiornaRimborsoNotte(da_rimborsare, id);
    if (!aggiornata) throw new ErroreHttp(404, 'Occupazione non trovata');

    res.json({ success: true, da_rimborsare: aggiornata.da_rimborsare });
  } catch (err) {
    next(err);
  }
});

export default router;