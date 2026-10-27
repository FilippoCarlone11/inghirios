import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

// Helper per trasformare una data del DB nel formato richiesto dall'input datetime-local (YYYY-MM-DDTHH:mm)
function formattaPerInput(dataISO) {
  if (!dataISO) return '';
  const d = new Date(dataISO);
  // Sottrae il fuso orario per avere l'orario esatto nel datetime-local
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function GestioneTransfer() {
  const [biglietti, setBiglietti] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [persone, setPersone] = useState([]); // Per la lista dei runner
  const [caricamento, setCaricamento] = useState(true);

  // Stato per il form (Aggiunta/Modifica)
  const [modaleAperto, setModaleAperto] = useState(false);
  const [inInvio, setInInvio] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    caricaTutto();
  }, []);

  async function caricaTutto() {
    setCaricamento(true);
    try {
      // Eseguiamo tutte le chiamate in parallelo
      const [resBiglietti, resTransfers, resPersone] = await Promise.all([
        api('/biglietti/elenco-biglietti-da-per-cagliari'),
        api('/transfer/elenco-transfer'),
        api('/profile/elenco-persone') // Assumendo esista per avere i nomi dei runner
      ]);
      setBiglietti(resBiglietti);
      setTransfers(resTransfers);
      setPersone(resPersone);
    } catch (err) {
      alert("Errore nel caricamento: " + err.message);
    } finally {
      setCaricamento(false);
    }
  }

  // INCROCIO E ORDINAMENTO DATI
  const datiTabella = biglietti.map((biglietto) => {
    // Cerco se esiste già un transfer associato a questo biglietto
    const transferAssociato = transfers.find((t) => t.id_biglietto === biglietto.id);
    
    // Per l'ordinamento: uso l'orario di pickup, altrimenti l'orario di arrivo/partenza del volo
    const orarioRiferimento = transferAssociato?.orario_pickup 
      || biglietto.orario_arrivo_previsto 
      || biglietto.orario_partenza_previsto;

    return {
      ...biglietto,
      transfer: transferAssociato || null, // Se null, il transfer è da creare
      orarioRiferimento
    };
  }).sort((a, b) => new Date(a.orarioRiferimento) - new Date(b.orarioRiferimento)); // Ordine cronologico


  // GESTIONE FORM
  function apriGestioneTransfer(riga) {
    const t = riga.transfer;
    setForm({
      id_transfer: t ? t.id : '', // Se c'è l'ID, faremo una PUT/Modifica
      id_biglietto: riga.id,
      id_persona_da_trasferire: riga.id_persona,
      id_runner: t?.id_runner || '',
      orario_pickup: t?.orario_pickup ? formattaPerInput(t.orario_pickup) : formattaPerInput(riga.orarioRiferimento),
      luogo_pickup: t?.luogo_pickup || (riga.arrivo === 'CAG' ? 'Aeroporto Cagliari' : ''),
      luogo_destinazione: t?.luogo_destinazione || '',
      visibile_al_runner: t ? t.visibile_al_runner : false
    });
    setModaleAperto(true);
  }

  function aggiornaForm(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function salvaTransfer(e) {
    e.preventDefault();
    setInInvio(true);

    try {
      // Se il form ha un id_transfer, significa che lo stiamo modificando, altrimenti lo stiamo creando
      const endpoint = form.id_transfer ? `/transfer/modifica-transfer/${form.id_transfer}` : '/transfer/aggiungi-transfer';
      const metodo = form.id_transfer ? 'PUT' : 'POST';

      const transferSalvato = await api(endpoint, {
        metodo: metodo,
        corpo: {
          ...form,
          id_runner: form.id_runner ? Number(form.id_runner) : null,
          id_persona_da_trasferire: form.id_persona_da_trasferire ? Number(form.id_persona_da_trasferire) : null
        }
      });

      // Aggiorniamo la lista dei transfer senza ricaricare la pagina
      if (form.id_transfer) {
        setTransfers(prev => prev.map(t => t.id === form.id_transfer ? transferSalvato : t));
      } else {
        setTransfers(prev => [...prev, transferSalvato]);
      }
      
      setModaleAperto(false);
    } catch (err) {
      alert("Errore salvataggio: " + err.message);
    } finally {
      setInInvio(false);
    }
  }

  return (
    <main style={{ padding: '1rem' }}>
      <p><Link to="/">← Indietro</Link></p>
      <h1>Tabellone Arrivi/Partenze e Transfer (Cagliari)</h1>

      {caricamento ? (
        <p>Caricamento dati in corso...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ backgroundColor: '#f4f4f4' }}>
              <tr>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Ospite</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Tratta</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Orario Volo/Treno</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Orario Pickup</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Pickup &rarr; Destinazione</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Runner Assegnato</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {datiTabella.map((riga) => (
                <tr key={riga.id} style={{ borderBottom: '1px solid #eee' }}>
                  
                  {/* DATI BIGLIETTO */}
                  <td style={{ padding: '10px' }}><strong>{riga.nome} {riga.cognome}</strong></td>
                  <td style={{ padding: '10px' }}>{riga.partenza} &rarr; {riga.arrivo}</td>
                  <td style={{ padding: '10px', color: '#555' }}>
                    {new Date(riga.orarioRiferimento).toLocaleString('it-IT', { 
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                    })}
                  </td>
                  
                  {/* DATI TRANSFER */}
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>
                    {riga.transfer?.orario_pickup 
                      ? new Date(riga.transfer.orario_pickup).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) 
                      : <span style={{ color: 'red' }}>Da definire</span>}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {riga.transfer?.luogo_pickup || '?'} &rarr; {riga.transfer?.luogo_destinazione || '?'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {riga.transfer?.nome_runner ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>
                        {riga.transfer.nome_runner} {riga.transfer.cognome_runner}
                      </span>
                    ) : (
                      <span style={{ color: '#aaa', fontStyle: 'italic' }}>Nessuno</span>
                    )}
                  </td>
                  
                  {/* AZIONI */}
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => apriGestioneTransfer(riga)}>
                      {riga.transfer ? 'Modifica' : 'Assegna Runner'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALE DI AGGIUNTA / MODIFICA TRANSFER */}
      {modaleAperto && form && (
        <div style={stileModale}>
          <div style={stileContenutoModale}>
            <h2>{form.id_transfer ? 'Modifica Transfer' : 'Crea Transfer e Assegna Runner'}</h2>
            
            <form onSubmit={salvaTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <label>
                Runner:
                <select name="id_runner" value={form.id_runner} onChange={aggiornaForm} style={{ width: '100%' }}>
                  <option value="">-- Nessun runner (Lascia in sospeso) --</option>
                  {persone.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} {p.cognome}</option>
                  ))}
                </select>
              </label>

              <label>
                Orario Pickup:
                <input name="orario_pickup" type="datetime-local" value={form.orario_pickup} onChange={aggiornaForm} style={{ width: '100%' }} />
              </label>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1 }}>
                  Luogo Pickup:
                  <input name="luogo_pickup" type="text" value={form.luogo_pickup} onChange={aggiornaForm} style={{ width: '100%' }} />
                </label>
                <label style={{ flex: 1 }}>
                  Destinazione (Obbligatorio):
                  <input name="luogo_destinazione" type="text" value={form.luogo_destinazione} onChange={aggiornaForm} required style={{ width: '100%' }} />
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input name="visibile_al_runner" type="checkbox" checked={form.visibile_al_runner} onChange={aggiornaForm} />
                Rendi visibile nell'app del runner
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModaleAperto(false)} style={{ flex: 1, backgroundColor: '#ccc' }}>Annulla</button>
                <button type="submit" disabled={inInvio} style={{ flex: 2 }}>
                  {inInvio ? 'Salvataggio...' : 'Salva Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// Stili base per il popup modale
const stileModale = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const stileContenutoModale = {
  backgroundColor: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
};