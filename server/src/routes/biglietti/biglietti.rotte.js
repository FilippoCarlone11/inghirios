import { Router } from 'express';

import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import { elencoBiglietti, aggiungiBiglietto, elencoBigliettiDaPerCagliari, eliminaBiglietto  } from './biglietti.query.js';
import { RUOLI } from '../../ruoli.js';

const router = Router();


router.get('/elenco-biglietti', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoBiglietti());
});

router.get('/elenco-biglietti-da-per-cagliari', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoBigliettiDaPerCagliari());
});


router.post('/aggiungi-biglietto', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const {
      id_utente,
      codice_prenotazione,
      codice_volo,
      codice_treno,
      compagnia,
      stato,
      costo,
      da_rimborsare_ospite,

      partenza,
      arrivo,
      orario_partenza_previsto,
      orario_arrivo_previsto,
      orario_partenza_confermato,
      orario_arrivo_confermato
    } = req.body;

    // Controllo obbligatori (aggiunti partenza e arrivo)
    if (!id_utente || !compagnia || !stato || costo === undefined || !partenza || !arrivo) {
      throw new ErroreHttp(400, 'Compila tutti i campi obbligatori (inclusi partenza e arrivo)');
    }

    const biglietto = await aggiungiBiglietto({
      id_utente: Number(id_utente), 
      codice_prenotazione: codice_prenotazione || null,
      codice_volo: codice_volo || null,
      codice_treno: codice_treno || null,
      compagnia: compagnia.trim().toLowerCase(),
      stato: stato.trim().toLowerCase(),
      costo: Number(costo),
      da_rimborsare_ospite: Boolean(da_rimborsare_ospite),
      partenza: partenza.trim(),
      arrivo: arrivo.trim(),
      // Se l'orario è una stringa vuota, passiamo null al DB per evitare errori sul timestamp
      orario_partenza_previsto: orario_partenza_previsto || null,
      orario_arrivo_previsto: orario_arrivo_previsto || null,
      orario_partenza_confermato: orario_partenza_confermato || null,
      orario_arrivo_confermato: orario_arrivo_confermato || null
    });

    res.status(201).json(biglietto);

  } catch (err) {
    console.error("ERRORE CREAZIONE BIGLIETTO:", err); 
    next(err); 
  }
});

router.delete('/elimina-biglietto/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_biglietto = Number(req.params.id);
    
    const bigliettoEliminato = await eliminaBiglietto(id_biglietto);

    if (!bigliettoEliminato) {
      throw new ErroreHttp(404, 'Biglietto non trovato');
    }

    res.status(200).json({ 
      success: true, 
      message: 'Biglietto eliminato con successo' 
    });

  } catch (err) {
    console.error("ERRORE ELIMINAZIONE BIGLIETTO:", err); 
    next(err); 
  }
});


export default router;