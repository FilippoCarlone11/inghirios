import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

const STATI_BIGLIETTO = [
  'comprato', 'in_ritardo', 'arrivato', 'cancellato', 'rimborso_richiesto', 'rimborso_ottenuto'
];

const COMPAGNIE = [
  'trenitalia', 'italo', 'trenord',
  'ita_airways', 'ryanair', 'easyjet', 'wizz_air', 'volotea', 'vueling', 
  'lufthansa', 'air_france', 'klm', 'british_airways', 'emirates', 
  'qatar_airways', 'american_airlines', 'delta',
  'grimaldi_lines', 'moby', 'tirrenia', 'gnv', 'corsica_ferries',
  'altra_compagnia', 'nessuna'
];

// 1. Aggiunti i nuovi campi nello stato iniziale vuoto
const FORM_VUOTO = {
  id_utente: '',
  codice_prenotazione: '',
  codice_volo: '',
  codice_treno: '',
  compagnia: '',
  stato: '',
  costo: '',
  da_rimborsare_ospite: false,
  partenza: '',
  arrivo: '',
  orario_partenza_previsto: '',
  orario_arrivo_previsto: '',
  orario_partenza_confermato: '',
  orario_arrivo_confermato: ''
};

export default function GestioneBiglietti() {
    const [persone, setPersone]  = useState([]);
    const [dati, setDati] = useState(FORM_VUOTO);
    const [biglietti, setBiglietti] = useState([]);
    const [errore, setErrore] = useState('');
    const [successo, setSuccesso] = useState('');
    const [inInvio, setInInvio] = useState(false);
    const [caricamento, setCaricamento] = useState(true);

    // Carica i biglietti all'avvio
    useEffect(() => {
        caricaBiglietti();
        caricaPersone();
    }, []);

    async function caricaPersone(){
        try{
            const utenti= await api('/profile/elenco-persone');
            setPersone(utenti);
        } catch (err) {
            setErrore('Errore nel caricamento delle persone: ' + err.message);
        } finally {
            setCaricamento(false);
        }
    }

    async function caricaBiglietti() {
        try {
            const datiRicevuti = await api('/biglietti/elenco-biglietti');
            setBiglietti(datiRicevuti);
        } catch (err) {
            setErrore('Errore nel caricamento dei biglietti: ' + err.message);
        }
    }

    function aggiorna(evento) {
        const { name, value, type, checked } = evento.target;
        setDati((precedenti) => ({
            ...precedenti,
            [name]: type === 'checkbox' ? checked : value
        }));
    }

    async function invia(evento) {
        evento.preventDefault();
        setErrore('');
        setSuccesso('');
        setInInvio(true);
        
        const datiFormattati = {
            ...dati,
            id_utente: parseInt(dati.id_utente, 10),
            costo: parseFloat(dati.costo)
        };

        try {
            const creato = await api('/biglietti/aggiungi-biglietto', {
                metodo: 'POST',
                corpo: datiFormattati,
            });
            setSuccesso(`Biglietto creato con ID: ${creato.id}`);
            setDati(FORM_VUOTO);
            // Aggiunge il nuovo biglietto in cima alla lista senza ricaricare la pagina
            setBiglietti((prev) => [creato, ...prev]); 
        } catch (err) {
            setErrore(err.message);
        } finally {
            setInInvio(false);
        }
  }

  // Helper per formattare gli ENUM
  const formattaEnum = (testo) => testo?.replace(/_/g, ' ').toUpperCase() || '';

  return (
    <main>
      <p>
        <Link to="/">← Indietro</Link>
      </p>
      
      <section style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* SEZIONE FORM */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1>Aggiungi Biglietto</h1>
          <form onSubmit={invia}>
            <label>
                Persona
                <select name="id_utente" value={dati.id_utente} onChange={aggiorna} required>
                    <option value="">Scegli una persona</option>
                    {persone.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                        {persona.nome} {persona.cognome}
                    </option>
                    ))}
                </select>
            </label>

            {/* 2. NUOVI CAMPI TRATTA */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1 }}>
                Da (Partenza)
                <input name="partenza" type="text" value={dati.partenza} onChange={aggiorna} required placeholder="Es. Roma" />
              </label>
              <label style={{ flex: 1 }}>
                A (Arrivo)
                <input name="arrivo" type="text" value={dati.arrivo} onChange={aggiorna} required placeholder="Es. Milano" />
              </label>
            </div>

            <label>
              Cod. Prenotazione
              <input name="codice_prenotazione" type="text" value={dati.codice_prenotazione} onChange={aggiorna} />
            </label>

            <label>
              Cod. Volo
              <input name="codice_volo" type="text" value={dati.codice_volo} onChange={aggiorna} />
            </label>

            <label>
              Cod. Treno
              <input name="codice_treno" type="text" value={dati.codice_treno} onChange={aggiorna} />
            </label>

            <label>
              Compagnia
              <select name="compagnia" value={dati.compagnia} onChange={aggiorna} required>
                <option value="">Scegli una compagnia</option>
                {COMPAGNIE.map((c) => <option key={c} value={c}>{formattaEnum(c)}</option>)}
              </select>
            </label>

            <label>
              Stato
              <select name="stato" value={dati.stato} onChange={aggiorna} required>
                <option value="">Scegli lo stato</option>
                {STATI_BIGLIETTO.map((s) => <option key={s} value={s}>{formattaEnum(s)}</option>)}
              </select>
            </label>

            {/* 3. NUOVI CAMPI ORARI */}
            <fieldset style={{ margin: '15px 0', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
              <legend style={{ padding: '0 5px', fontWeight: 'bold' }}>Orari Previsti</legend>
              <label>
                Partenza prevista:
                <input name="orario_partenza_previsto" type="datetime-local" value={dati.orario_partenza_previsto} onChange={aggiorna} />
              </label>
              <label>
                Arrivo previsto:
                <input name="orario_arrivo_previsto" type="datetime-local" value={dati.orario_arrivo_previsto} onChange={aggiorna} />
              </label>
            </fieldset>

            <fieldset style={{ margin: '15px 0', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
              <legend style={{ padding: '0 5px', fontWeight: 'bold' }}>Orari Effettivi / Confermati</legend>
              <label>
                Partenza confermata:
                <input name="orario_partenza_confermato" type="datetime-local" value={dati.orario_partenza_confermato} onChange={aggiorna} />
              </label>
              <label>
                Arrivo confermato:
                <input name="orario_arrivo_confermato" type="datetime-local" value={dati.orario_arrivo_confermato} onChange={aggiorna} />
              </label>
            </fieldset>

            <label>
              Costo (€)
              <input name="costo" type="number" step="0.01" min="0" value={dati.costo} onChange={aggiorna} required />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <input name="da_rimborsare_ospite" type="checkbox" checked={dati.da_rimborsare_ospite} onChange={aggiorna} />
              Da rimborsare ospite
            </label>

            {errore && <p role="alert" style={{ color: 'red' }}>{errore}</p>}
            {successo && <p role="status" style={{ color: 'green' }}>{successo}</p>}

            <button type="submit" disabled={inInvio}>
              {inInvio ? 'Salvataggio...' : 'Crea Biglietto'}
            </button>
          </form>
        </div>

        {/* SEZIONE LISTA */}
        <div style={{ flex: '2', minWidth: '400px' }}>
          <h2>Biglietti Salvati</h2>
          {caricamento ? (
            <p>Caricamento biglietti in corso...</p>
          ) : biglietti.length === 0 ? (
            <p>Nessun biglietto presente nel database.</p>
          ) : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc' }}>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Cognome</th>
                  <th>Tratta</th> {/* Aggiunta colonna tratta */}
                  <th>Compagnia</th>
                  <th>Codici (Pren. / Volo / Treno)</th>
                  <th>Stato</th>
                  <th>Costo</th>
                  <th>Rimborso</th>
                </tr>
              </thead>
              <tbody>
                {biglietti.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td>{b.id}</td>
                    <td>{b.nome}</td>
                    <td>{b.cognome}</td>
                    
                    {/* Visualizziamo visivamente la tratta (Es: Roma -> Milano) */}
                    <td><strong>{b.partenza || '?'}</strong> &rarr; {b.arrivo || '?'}</td>
                    
                    <td>{formattaEnum(b.compagnia)}</td>
                    <td>
                      {[b.codice_prenotazione, b.codice_volo, b.codice_treno]
                        .filter(Boolean) // Filtra i codici null/vuoti
                        .join(' / ') || '-'}
                    </td>
                    <td>{formattaEnum(b.stato)}</td>
                    <td>€{Number(b.costo).toFixed(2)}</td>
                    <td>{b.da_rimborsare_ospite ? 'Sì' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </section>
    </main>
  );
}