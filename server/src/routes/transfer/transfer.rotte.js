import { Router } from 'express';

import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import {
  elencoTransferRegistrati,
  salvaGruppoTransfer,
  impostaVisibilita,
  eliminaTransfer,
  eliminaTransferMultipli,
  elencoAccompagnatoriPersona,
  elencoPasseggeri,
  elencoLuoghi,
  aggiungiLuogo,
  elencoTrasfersUtente,
  elencoColoriRunner,
  impostaColoreRunner
} from './transfer.query.js';
import { RUOLI } from '../../ruoli.js';

const router = Router();

const soloAdmin = [richiediAuth, richiediRuolo(RUOLI.ADMIN)];
const listaIdValida = (v) => Array.isArray(v) ? v.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];

router.get('/elenco-transfer', ...soloAdmin, async (req, res, next) => {
  try { res.json(await elencoTransferRegistrati()); } catch (err) { next(err); }
});

// Crea o modifica un transfer di gruppo (un runner, un orario, più passeggeri)
router.post('/salva-gruppo', ...soloAdmin, async (req, res, next) => {
  try {
    const {
      ids_esistenti, id_runner, orario_pickup, luogo_pickup,
      luogo_destinazione, visibile_al_runner, passeggeri
    } = req.body;

    if (!Array.isArray(passeggeri) || passeggeri.length === 0) {
      throw new ErroreHttp(400, 'Aggiungi almeno un passeggero');
    }
    if (passeggeri.some((p) => !/^[pam]_\d+$/.test(p?.chiave || ''))) {
      throw new ErroreHttp(400, 'Passeggero non valido');
    }

    const transfer = await salvaGruppoTransfer({
      ids_esistenti: listaIdValida(ids_esistenti),
      id_runner: id_runner ? Number(id_runner) : null,
      orario_pickup: orario_pickup || null,
      luogo_pickup: luogo_pickup ? String(luogo_pickup).trim() : null,
      luogo_destinazione: luogo_destinazione ? String(luogo_destinazione).trim() : null,
      visibile_al_runner: Boolean(visibile_al_runner),
      passeggeri: passeggeri.map((p) => ({
        chiave: p.chiave,
        id_biglietto: p.id_biglietto ? Number(p.id_biglietto) : null
      }))
    });

    res.status(200).json(transfer);
  } catch (err) {
    console.error('ERRORE SALVATAGGIO TRANSFER:', err);
    next(err);
  }
});

// Toggle "visibile al runner" su una o più righe (un gruppo, o tutti i gruppi di un runner)
router.patch('/visibilita', ...soloAdmin, async (req, res, next) => {
  try {
    const ids = listaIdValida(req.body.ids);
    if (ids.length === 0) throw new ErroreHttp(400, 'Nessun transfer selezionato');

    await impostaVisibilita(ids, Boolean(req.body.visibile));
    res.json({ success: true });
  } catch (err) {
    console.error('ERRORE VISIBILITA TRANSFER:', err);
    next(err);
  }
});

router.delete('/elimina-gruppo', ...soloAdmin, async (req, res, next) => {
  try {
    const ids = listaIdValida(String(req.query.ids || '').split(','));
    if (ids.length === 0) throw new ErroreHttp(400, 'Nessun transfer selezionato');

    const eliminati = await eliminaTransferMultipli(ids);
    if (!eliminati) throw new ErroreHttp(404, 'Transfer non trovato');

    res.json({ success: true });
  } catch (err) {
    console.error('ERRORE ELIMINAZIONE GRUPPO TRANSFER:', err);
    next(err);
  }
});

router.delete('/elimina-transfer/:id', ...soloAdmin, async (req, res, next) => {
  try {
    const id_transfer = Number(req.params.id);
    if (!id_transfer) throw new ErroreHttp(400, 'ID Transfer mancante o non valido');

    const eliminato = await eliminaTransfer(id_transfer);
    if (!eliminato) throw new ErroreHttp(404, 'Transfer non trovato');

    res.status(200).json({ success: true, message: 'Transfer eliminato con successo' });
  } catch (err) {
    console.error('ERRORE ELIMINAZIONE TRANSFER:', err);
    next(err);
  }
});

router.get('/accompagnatori/:id_persona', ...soloAdmin, async (req, res, next) => {
  try {
    const id_persona = Number(req.params.id_persona);
    if (!id_persona) throw new ErroreHttp(400, 'ID persona non valido');
    res.json(await elencoAccompagnatoriPersona(id_persona));
  } catch (err) { next(err); }
});

router.get('/elenco-passeggeri', ...soloAdmin, async (req, res, next) => {
  try { res.json(await elencoPasseggeri()); } catch (err) { next(err); }
});

router.get('/elenco-luoghi', ...soloAdmin, async (req, res, next) => {
  try { res.json(await elencoLuoghi()); } catch (err) { next(err); }
});

router.post('/aggiungi-luogo', ...soloAdmin, async (req, res, next) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const indirizzo = String(req.body.indirizzo || '').trim();
    if (!nome) throw new ErroreHttp(400, 'Il nome del luogo è obbligatorio');

    const luogo = await aggiungiLuogo({
      nome,
      indirizzo,
      latitudine: req.body.latitudine ?? null,
      longitudine: req.body.longitudine ?? null
    });
    res.status(201).json(luogo);
  } catch (err) {
    if (err.code === '23505') return next(new ErroreHttp(409, 'Esiste già un luogo con questo nome'));
    console.error('ERRORE CREAZIONE LUOGO:', err);
    next(err);
  }
});

router.get('/elenco-transfer-utente/:id', ...soloAdmin, async (req, res, next) => {
  try {
    const id_utente = Number(req.params.id);
    if (!id_utente) throw new ErroreHttp(400, 'ID utente non valido');

    const transfers = await elencoTrasfersUtente(id_utente);
    res.status(200).json({ id_utente, transfers });
  } catch (err) {
    console.error('ERRORE RECUPERO TRANSFER:', err);
    next(err);
  }
});

router.get('/colori-runner', ...soloAdmin, async (req, res, next) => {
  try { res.json(await elencoColoriRunner()); } catch (err) { next(err); }
});

router.put('/colore-runner/:id_runner', ...soloAdmin, async (req, res, next) => {
  try {
    const id_runner = Number(req.params.id_runner);
    if (!id_runner) throw new ErroreHttp(400, 'ID runner non valido');

    const grezzo = String(req.body.colore || '').trim();
    const colore = (grezzo.startsWith('#') ? grezzo : `#${grezzo}`).toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(colore)) throw new ErroreHttp(400, 'Colore non valido: usa il formato esadecimale, es. #3b82f6');

    res.json(await impostaColoreRunner(id_runner, colore));
  } catch (err) {
    if (err.code === '23503') return next(new ErroreHttp(404, 'Runner non trovato'));
    console.error('ERRORE COLORE RUNNER:', err);
    next(err);
  }
});

export default router;