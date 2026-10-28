import { useState, useEffect } from 'react';
import { api } from '../../api.js';

const COMPAGNIE = [
  'trenitalia', 'italo', 'trenord',
  'ita_airways', 'ryanair', 'easyjet', 'wizz_air', 'volotea', 'vueling', 
  'lufthansa', 'air_france', 'klm', 'british_airways', 'emirates', 
  'qatar_airways', 'american_airlines', 'delta',
  'grimaldi_lines', 'moby', 'tirrenia', 'gnv', 'corsica_ferries',
  'altra_compagnia', 'nessuna'
];

const CODICI_LUOGHI = [
  { codice: 'FCO', nome: 'Roma Fiumicino' },
  { codice: 'CIA', nome: 'Roma Ciampino' },
  { codice: 'MXP', nome: 'Milano Malpensa' },
  { codice: 'LIN', nome: 'Milano Linate' },
  { codice: 'BGY', nome: 'Bergamo Orio al Serio' },
  { codice: 'TRN', nome: 'Torino Caselle' },
  { codice: 'VCE', nome: 'Venezia Marco Polo' },
  { codice: 'BLQ', nome: 'Bologna Guglielmo Marconi' },
  { codice: 'NAP', nome: 'Napoli Capodichino' },
  { codice: 'CTA', nome: 'Catania Fontanarossa' },
  { codice: 'PMO', nome: 'Palermo Punta Raisi' },
  { codice: 'BRI', nome: 'Bari Palese' },
  { codice: 'CAG', nome: 'Cagliari Elmas' },
  { codice: 'PSA', nome: 'Pisa San Giusto' },
  { codice: 'FLR', nome: 'Firenze Peretola' },
  { codice: 'VRN', nome: 'Verona Villafranca' },
  { codice: 'SUF', nome: 'Lamezia Terme' },
  { codice: 'OLB', nome: 'Olbia Costa Smeralda' }
];

const FORM_VUOTO = {
  id_utente: '',
  codice_prenotazione: '',
  codice_volo: '',
  codice_treno: '',
  compagnia: '',
  stato: 'comprato',
  costo: '',
  da_rimborsare_ospite: false,
  partenza: '',
  arrivo: '',
  orario_partenza_previsto: '',
  orario_arrivo_previsto: ''
};

export default function GestioneBiglietti() {
  const [persone, setPersone] = useState([]);
  const [accompagnatori, setAccompagnatori] = useState([]);
  const [dati, setDati] = useState(FORM_VUOTO);
  const [biglietti, setBiglietti] = useState([]);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    caricaBiglietti();
    caricaOspiti();
  }, []);

  // Unica funzione per caricare contemporaneamente persone e accompagnatori
  async function caricaOspiti() {
    try {
      const [utenti, acc] = await Promise.all([
        api('/profile/elenco-persone'),
        api('/profile/elenco-accompagnatori')
      ]);
      setPersone(utenti);
      setAccompagnatori(acc);
    } catch (err) {
      setErrore('Errore nel caricamento ospiti: ' + err.message);
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
      setBiglietti((prev) => [creato, ...prev]);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  async function eliminaBiglietto(id) {
    if (!window.confirm("Sei sicuro di voler eliminare questo biglietto?")) return;
    
    setErrore('');
    setSuccesso('');
    
    try {
      await api(`/biglietti/elimina-biglietto/${id}`, { metodo: 'DELETE' }); 
      setSuccesso('Biglietto eliminato con successo.');
      setBiglietti((prev) => prev.filter(b => b.id !== id));
    } catch (err) {
      try {
        await api(`/biglietti/${id}`, { metodo: 'DELETE' });
        setSuccesso('Biglietto eliminato con successo.');
        setBiglietti((prev) => prev.filter(b => b.id !== id));
      } catch (err2) {
        setErrore('Errore nella cancellazione: ' + err2.message);
      }
    }
  }

  const formattaEnum = (testo) => testo?.replace(/_/g, ' ').toUpperCase() || '';

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Gestione Biglietti</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div className="card">
          <h2>Aggiungi Biglietto</h2>
          <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <label>
                Ospite (Persona o Accompagnatore)
                <select name="id_utente" value={dati.id_utente} onChange={aggiorna} required>
                  <option value="">Scegli un ospite...</option>
                  
                  {/* Gruppo Persone Normali */}
                  <optgroup label="Utenti Principali">
                    {persone.map((persona) => (
                      <option key={`p_${persona.id}`} value={persona.id}>
                        {persona.nome} {persona.cognome}
                      </option>
                    ))}
                  </optgroup>

                  {/* Gruppo Accompagnatori */}
                  <optgroup label="Accompagnatori">
                    {accompagnatori.map((acc) => (
                      <option key={`a_${acc.id_accompagnatore}`} value={acc.id_accompagnatore}>
                        {acc.nome_accompagnatore} {acc.cognome_accompagnatore} (Accompagnatore di {acc.nome_persona} {acc.cognome_persona})
                      </option>
                    ))}
                  </optgroup>

                </select>
              </label>

              <label>
                Da (Partenza)
                <select name="partenza" value={dati.partenza} onChange={aggiorna} required>
                  <option value="">Scegli partenza...</option>
                  {CODICI_LUOGHI.map((luogo) => (
                    <option key={luogo.codice} value={luogo.codice}>
                      {luogo.codice} - {luogo.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                A (Arrivo)
                <select name="arrivo" value={dati.arrivo} onChange={aggiorna} required>
                  <option value="">Scegli arrivo...</option>
                  {CODICI_LUOGHI.map((luogo) => (
                    <option key={luogo.codice} value={luogo.codice}>
                      {luogo.codice} - {luogo.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <label>
                Compagnia
                <select name="compagnia" value={dati.compagnia} onChange={aggiorna} required>
                  <option value="">Scegli...</option>
                  {COMPAGNIE.map((c) => <option key={c} value={c}>{formattaEnum(c)}</option>)}
                </select>
              </label>
              
              <label>
                Stato
                <select name="stato" value={dati.stato} onChange={aggiorna} required>
                  <option value="comprato">COMPRATO</option>
                  <option value="in_ritardo">IN RITARDO</option>
                  <option value="arrivato">ARRIVATO</option>
                  <option value="cancellato">CANCELLATO</option>
                  <option value="rimborso_richiesto">RIMBORSO RICHIESTO</option>
                  <option value="rimborso_ottenuto">RIMBORSO OTTENUTO</option>
                </select>
              </label>

              <label>
                Costo (€)
                <input name="costo" type="number" step="0.01" min="0" value={dati.costo} onChange={aggiorna} required />
              </label>
            </div>

            <fieldset style={{ margin: '0', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <legend style={{ padding: '0 8px', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Orari Previsti</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <label style={{ marginBottom: 0 }}>
                  Partenza:
                  <input name="orario_partenza_previsto" type="datetime-local" value={dati.orario_partenza_previsto} onChange={aggiorna} />
                </label>
                <label style={{ marginBottom: 0 }}>
                  Arrivo:
                  <input name="orario_arrivo_previsto" type="datetime-local" value={dati.orario_arrivo_previsto} onChange={aggiorna} />
                </label>
              </div>
            </fieldset>

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input name="da_rimborsare_ospite" type="checkbox" checked={dati.da_rimborsare_ospite} onChange={aggiorna} style={{ marginTop: 0 }} />
              Da rimborsare all'ospite
            </label>

            {errore && <p role="alert" style={{ color: '#ef4444', margin: 0 }}>{errore}</p>}
            {successo && <p role="status" style={{ color: '#10b981', margin: 0 }}>{successo}</p>}

            <div style={{ marginTop: '0.5rem' }}>
              <button type="submit" disabled={inInvio}>
                {inInvio ? 'Salvataggio...' : 'Crea Biglietto'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Biglietti Salvati</h2>
          {caricamento ? (
            <p style={{ color: 'var(--text-muted)' }}>Caricamento biglietti in corso...</p>
          ) : biglietti.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nessun biglietto presente nel database.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ospite</th>
                    <th>Tratta</th>
                    <th>Compagnia</th>
                    <th>Codici (Pren/Volo/Tr)</th>
                    <th>Stato</th>
                    <th>Costo</th>
                    <th style={{ textAlign: 'center' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {biglietti.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.nome} {b.cognome}</strong></td>
                      <td><strong>{b.partenza || '?'}</strong> &rarr; {b.arrivo || '?'}</td>
                      <td>{formattaEnum(b.compagnia)}</td>
                      <td>
                        {[b.codice_prenotazione, b.codice_volo, b.codice_treno]
                          .filter(Boolean)
                          .join(' / ') || '-'}
                      </td>
                      <td>
                        <span style={{
                          backgroundColor: '#e2e8f0', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.85rem'
                        }}>
                          {formattaEnum(b.stato)}
                        </span>
                      </td>
                      <td>€{Number(b.costo).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-secondary"
                          onClick={() => eliminaBiglietto(b.id)}
                          style={{ padding: '0.4rem 0.6rem', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                          title="Elimina biglietto"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}