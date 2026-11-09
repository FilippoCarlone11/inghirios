import { Router } from 'express';

import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import { elencoTransferRegistrati, modificaTransfer, aggiungiTransfer, elencoTrasfersUtente } from './transfer.query.js';
import { RUOLI } from '../../ruoli.js';

const router = Router();



router.get('/elenco-transfer', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoTransferRegistrati());
});

router.post('/aggiungi-transfer', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const {
      id_biglietto,
      id_runner,
      id_persona_da_trasferire,
      orario_pickup,
      luogo_pickup,
      luogo_destinazione,
      visibile_al_runner,
    } = req.body;

    // Controllo obbligatori (in base alla struttura del DB per la tabella transfer)
    if (!id_biglietto || !luogo_destinazione) {
      throw new ErroreHttp(400, 'Compila tutti i campi obbligatori (Biglietto di riferimento e Destinazione)');
    }

    // Assicurati di aver importato aggiungiTransfer all'inizio del file!
    const transfer = await aggiungiTransfer({
      id_biglietto: Number(id_biglietto),
      id_runner: id_runner ? Number(id_runner) : null,
      id_persona_da_trasferire: id_persona_da_trasferire ? Number(id_persona_da_trasferire) : null,
      orario_pickup: orario_pickup || null,
      luogo_pickup: luogo_pickup ? luogo_pickup.trim() : null,
      luogo_destinazione: luogo_destinazione.trim(),
      visibile_al_runner: Boolean(visibile_al_runner)
    });

    res.status(201).json(transfer);

  } catch (err) {
    console.error("ERRORE CREAZIONE TRANSFER:", err); 
    next(err); 
  }
});


router.put('/modifica-transfer/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_transfer = Number(req.params.id);
    
    const {
      id_runner,
      id_persona_da_trasferire,
      orario_pickup,
      luogo_pickup,
      luogo_destinazione,
      visibile_al_runner,
    } = req.body;

    // Controllo obbligatori base
    if (!id_transfer) {
      throw new ErroreHttp(400, 'ID Transfer mancante o non valido');
    }
    if (!luogo_destinazione) {
      throw new ErroreHttp(400, 'La destinazione è obbligatoria');
    }

    const transferAggiornato = await modificaTransfer(id_transfer, {
      id_runner: id_runner ? Number(id_runner) : null,
      id_persona_da_trasferire: id_persona_da_trasferire ? Number(id_persona_da_trasferire) : null,
      orario_pickup: orario_pickup || null,
      luogo_pickup: luogo_pickup ? luogo_pickup.trim() : null,
      luogo_destinazione: luogo_destinazione.trim(),
      visibile_al_runner: Boolean(visibile_al_runner)
    });

    if (!transferAggiornato) {
      throw new ErroreHttp(404, 'Transfer non trovato');
    }

    res.status(200).json(transferAggiornato);

  } catch (err) {
    console.error("ERRORE MODIFICA TRANSFER:", err); 
    next(err); 
  }
});

router.delete('/elimina-transfer/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const id_transfer = Number(req.params.id);
    if (!id_transfer) {
      throw new ErroreHttp(400, 'ID Transfer mancante o non valido');
    }

    const transferEliminato = await eliminaTransfer(id_transfer); // Richiede l'aggiunta in transfer.query.js

    if (!transferEliminato) {
      throw new ErroreHttp(404, 'Transfer non trovato');
    }

    res.status(200).json({ success: true, message: 'Transfer eliminato con successo' });
  } catch (err) {
    console.error("ERRORE ELIMINAZIONE TRANSFER:", err);
    next(err);
  }
});

router.get('elenco-transfer-utente/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const { id_utente } = req.params;
    const transfers = await elencoTrasfersUtente(id_utente);

    res.status(200).json({ 
      id_utente,
      transfers
    });
  } catch (err) {
    console.error("ERRORE RECUPERO TRANSFER:", err); 
    next(err); 
  }

});
export default router;