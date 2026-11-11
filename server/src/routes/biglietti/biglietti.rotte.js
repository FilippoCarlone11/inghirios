import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import { elencoBiglietti, aggiungiBiglietto, eliminaBiglietto, trovaBigliettiPerUtenteID, modificaBiglietto, cambiaStatoBiglietto, elencoBigliettiDaPerCagliari, cambiaStatoRimborsoBiglietto } from './biglietti.query.js';
import { RUOLI } from '../../ruoli.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Setup cartella di upload
const uploadDir = path.join(process.cwd(), 'uploads', 'fatture');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Setup Multer con logica del nome file dinamico
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const { nome_passeggero, partenza, arrivo } = req.body;
    const nomePulito = (nome_passeggero || 'sconosciuto').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const ext = path.extname(file.originalname);
    cb(null, `${nomePulito}_${partenza}_${arrivo}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const router = Router();



// Storage temporaneo in memoria solo per l'analisi al volo
const uploadTemp = multer({ storage: multer.memoryStorage() });

const MESI = { gennaio:'01', febbraio:'02', marzo:'03', aprile:'04', maggio:'05', giugno:'06',
  luglio:'07', agosto:'08', settembre:'09', ottobre:'10', novembre:'11', dicembre:'12' };

const AEROPORTI = [
  [/milano bergamo|orio al serio/i, 'BGY'],
  [/milano malpensa/i, 'MXP'],
  [/roma fiumicino/i, 'FCO'],
  [/cagliari/i, 'CAG'],
  [/stoccolma arlanda/i, 'ARN'],
];
const codiceAeroporto = (nome) => AEROPORTI.find(([re]) => re.test(nome))?.[1] || '';
const numero = (s) => parseFloat(s.replace(/\./g, '').replace(',', '.'));

router.post('/analizza-pdf', richiediAuth, richiediRuolo(RUOLI.ADMIN), uploadTemp.single('fattura'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ errore: 'Nessun file' });

    const { text: grezzo } = await pdfParse(req.file.buffer);
    const text = grezzo.replace(/\s+/g, ' ');
    console.log('TESTO PDF:', text); // se qualcosa non va, guarda qui

    const out = {};

    // 1. PNR (Ryanair: sempre 6 caratteri)
    const pnr = text.match(/NUMERO DI PRENOTAZIONE:\s*([A-Z0-9]{6})/i);
    if (pnr) out.codice_prenotazione = pnr[1].toUpperCase();

    // 2. Riga del volo: "Milano Bergamo a Stoccolma Arlanda 5 novembre, 2026 09:30 - 12:15 FR2878"
    const volo = text.match(
      /Informazioni sui voli\s*(.+?)\s+a\s+(.+?)\s*(\d{1,2})\s+([a-zà-ù]+),?\s*(\d{4})\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*([A-Z]{2}\s?\d{1,4})/i
    );
    if (volo) {
      const [, da, a, g, meseStr, anno, oraP, oraA, codice] = volo;
      const mese = MESI[meseStr.toLowerCase()] || '01';
      const data = `${anno}-${mese}-${g.padStart(2, '0')}`;
      out.partenza = codiceAeroporto(da);
      out.arrivo = codiceAeroporto(a);
      out.orario_partenza_previsto = `${data}T${oraP}`;
      out.orario_arrivo_previsto = `${data}T${oraA}`;
      out.codice_volo = codice.replace(/\s/g, '').toUpperCase();
    }

    if (/ryanair/i.test(text)) out.compagnia = 'ryanair';

    // 3. Passeggeri
    const iPass = text.search(/Passeggeri/i);
    const sezPass = iPass >= 0 ? text.slice(iPass + 'Passeggeri'.length) : text;
    const nomi = [...new Set(
      [...sezPass.matchAll(/([A-ZÀ-Ý][a-zà-ÿ'’]+(?: [A-ZÀ-Ý][a-zà-ÿ'’]+)+)\s*(?:Adulti|Adulto|Bambini|Bambino|Neonati|Neonato)/g)]
        .map((m) => m[1])
    )];

    // 4. Costo per passeggero (somma degli importi nella sua parte della "Ripartizione del prezzo")
    const iPrezzo = text.search(/Ripartizione del prezzo/i);
    const iFine = text.search(/Metodo di pagamento|Totale pagato/i);
    const sezPrezzo = iPrezzo >= 0 ? text.slice(iPrezzo, iFine > iPrezzo ? iFine : undefined) : '';
    const posizioni = nomi.map((n) => sezPrezzo.indexOf(n));

    out.passeggeri = nomi.map((nome, i) => {
      const inizio = posizioni[i];
      if (inizio < 0) return { nome, costo: null };
      const fine = Math.min(...posizioni.filter((p) => p > inizio), sezPrezzo.length);
      const importi = [...sezPrezzo.slice(inizio, fine).matchAll(/(\d[\d.]*,\d{2})\s*€/g)].map((m) => numero(m[1]));
      return { nome, costo: Number(importi.reduce((s, x) => s + x, 0).toFixed(2)) };
    });

    const tot = text.match(/Totale pagato\s*(\d[\d.]*,\d{2})/i);
    if (tot) out.costo_totale = numero(tot[1]);

    console.log('DATI TROVATI:', out);
    res.json(out);
  } catch (err) {
    console.error('ERRORE LETTURA PDF:', err);
    res.status(500).json({ errore: err.message });
  }
});
// Funzione helper per parsare l'ID combinato dal frontend (es: "p_12", "a_4")
const parseIdOspite = (idSelezionato) => {
  let id_utente = null, id_accompagnatore = null, id_membro_ospite = null;
  if (!idSelezionato) return { id_utente, id_accompagnatore, id_membro_ospite };
  const idNum = Number(idSelezionato.substring(2));
  if (idSelezionato.startsWith('p_')) id_utente = idNum;
  else if (idSelezionato.startsWith('a_')) id_accompagnatore = idNum;
  else if (idSelezionato.startsWith('m_')) id_membro_ospite = idNum;
  return { id_utente, id_accompagnatore, id_membro_ospite };
};

router.get('/elenco-biglietti', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoBiglietti());
});

router.post('/aggiungi-biglietto', richiediAuth, richiediRuolo(RUOLI.ADMIN), upload.single('fattura'), async (req, res, next) => {
  try {
    const file_fattura = req.file ? req.file.filename : null;
    const { id_utente, compagnia, stato, costo, partenza, arrivo, da_rimborsare_ospite } = req.body;
    
    if (!id_utente || !compagnia || !stato || costo === undefined || !partenza || !arrivo) {
      throw new ErroreHttp(400, 'Compila tutti i campi obbligatori');
    }

    const assegnazione = parseIdOspite(id_utente);

    const biglietto = await aggiungiBiglietto({
      ...req.body,             // Prima i dati grezzi dal form
      ...assegnazione,         // POI sovrascriviamo id_utente grezzo con gli ID separati (pari a null o numero)
      compagnia: compagnia.trim().toLowerCase(),
      stato: stato.trim().toLowerCase(),
      costo: Number(costo),
      da_rimborsare_ospite: da_rimborsare_ospite === 'true',
      file_fattura
    });

    res.status(201).json(biglietto);
  } catch (err) { next(err); }
});

router.put('/modifica-biglietto/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), upload.single('fattura'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const file_fattura = req.file ? req.file.filename : null;
    const assegnazione = parseIdOspite(req.body.id_utente);
    
    const bigliettoAggiornato = await modificaBiglietto(id, {
      ...req.body,             // Prima i dati grezzi dal form
      ...assegnazione,         // POI sovrascriviamo con gli ID separati e corretti
      costo: Number(req.body.costo),
      file_fattura
    });
    res.status(200).json(bigliettoAggiornato);
  } catch (err) { next(err); }
});

router.patch('/cambia-stato/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const biglietto = await cambiaStatoBiglietto(Number(req.params.id), req.body.stato);
    res.status(200).json(biglietto);
  } catch (err) { next(err); }
});

router.patch('/cambia-stato-rimborso/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    const biglietto = await cambiaStatoRimborsoBiglietto(Number(req.params.id), req.body.stato);
    res.status(200).json(biglietto);
  } catch (err) { next(err); }
});

router.delete('/elimina-biglietto/:id', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res, next) => {
  try {
    await eliminaBiglietto(Number(req.params.id));
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
});

router.get('/elenco-biglietti-da-per-cagliari', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elencoBigliettiDaPerCagliari());
});

export default router;