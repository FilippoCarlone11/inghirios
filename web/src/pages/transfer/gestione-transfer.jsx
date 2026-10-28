import { useState, useEffect } from 'react';
import { api } from '../../api.js';

function formattaPerInput(dataISO) {
  if (!dataISO) return '';
  const d = new Date(dataISO);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function GestioneTransfer() {
  const [biglietti, setBiglietti] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [persone, setPersone] = useState([]); 
  const [caricamento, setCaricamento] = useState(true);

  const [modaleAperto, setModaleAperto] = useState(false);
  const [inInvio, setInInvio] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => { caricaTutto(); }, []);

  async function caricaTutto() {
    setCaricamento(true);
    try {
      const [resBiglietti, resTransfers, resPersone] = await Promise.all([
        api('/biglietti/elenco-biglietti-da-per-cagliari'),
        api('/transfer/elenco-transfer'),
        api('/profile/elenco-persone') 
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

  const datiTabella = biglietti.map((biglietto) => {
    const transferAssociato = transfers.find((t) => t.id_biglietto === biglietto.id);
    const orarioRiferimento = transferAssociato?.orario_pickup 
      || biglietto.orario_arrivo_previsto 
      || biglietto.orario_partenza_previsto;

    return {
      ...biglietto,
      transfer: transferAssociato || null,
      orarioRiferimento
    };
  }).sort((a, b) => new Date(a.orarioRiferimento) - new Date(b.orarioRiferimento));

  function apriGestioneTransfer(riga) {
    const t = riga.transfer;
    setForm({
      id_transfer: t ? t.id : '', 
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
    <>
      <div className="card">
        <h1>Tabellone Arrivi/Partenze e Transfer (Cagliari)</h1>
        
        {caricamento ? (
          <p>Caricamento dati in corso...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ospite</th>
                  <th>Tratta</th>
                  <th>Orario Volo/Treno</th>
                  <th>Orario Pickup</th>
                  <th>Pickup &rarr; Destinazione</th>
                  <th>Runner Assegnato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {datiTabella.map((riga) => (
                  <tr key={riga.id}>
                    <td><strong>{riga.nome} {riga.cognome}</strong></td>
                    <td>{riga.partenza} &rarr; {riga.arrivo}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(riga.orarioRiferimento).toLocaleString('it-IT', { 
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>
                      {riga.transfer?.orario_pickup 
                        ? new Date(riga.transfer.orario_pickup).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) 
                        : <span style={{ color: '#ef4444' }}>Da definire</span>}
                    </td>
                    <td>
                      {riga.transfer?.luogo_pickup || '?'} &rarr; {riga.transfer?.luogo_destinazione || '?'}
                    </td>
                    <td>
                      {riga.transfer?.nome_runner ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                          {riga.transfer.nome_runner} {riga.transfer.cognome_runner}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nessuno</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-secondary" onClick={() => apriGestioneTransfer(riga)}>
                        {riga.transfer ? 'Modifica' : 'Assegna Runner'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modaleAperto && form && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{marginTop: 0}}>{form.id_transfer ? 'Modifica Transfer' : 'Crea Transfer e Assegna Runner'}</h2>
            <form onSubmit={salvaTransfer}>
              
              <label>Runner:
                <select name="id_runner" value={form.id_runner} onChange={aggiornaForm}>
                  <option value="">-- Nessun runner (Lascia in sospeso) --</option>
                  {persone.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} {p.cognome}</option>
                  ))}
                </select>
              </label>

              <label>Orario Pickup:
                <input name="orario_pickup" type="datetime-local" value={form.orario_pickup} onChange={aggiornaForm} />
              </label>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ flex: 1 }}>Luogo Pickup:
                  <input name="luogo_pickup" type="text" value={form.luogo_pickup} onChange={aggiornaForm} />
                </label>
                <label style={{ flex: 1 }}>Destinazione (Obbligatorio):
                  <input name="luogo_destinazione" type="text" value={form.luogo_destinazione} onChange={aggiornaForm} required />
                </label>
              </div>

              <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
                <input name="visibile_al_runner" type="checkbox" checked={form.visibile_al_runner} onChange={aggiornaForm} style={{marginTop: 0}} />
                Rendi visibile nell'app del runner
              </label>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setModaleAperto(false)} style={{ flex: 1 }}>Annulla</button>
                <button type="submit" disabled={inInvio} style={{ flex: 2 }}>
                  {inInvio ? 'Salvataggio...' : 'Salva Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}