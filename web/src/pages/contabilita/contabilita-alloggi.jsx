import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { fmtData } from '../utils.js';

export default function ContabilitaAlloggi() {
  const [occupazioni, setOccupazioni] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');

  const caricaDati = () => {
    api('/alloggi/registro-contabile')
      .then(setOccupazioni)
      .catch(err => setErrore(err.message))
      .finally(() => setCaricamento(false));
  };

  useEffect(() => {
    setCaricamento(true);
    caricaDati();
  }, []);

  const cambiaStatoRimborso = async (id, daRimborsare) => {
    try {
      await api(`/alloggi/aggiorna-rimborso-notte/${id}`, { metodo: 'PATCH', corpo: { da_rimborsare: daRimborsare } });
      caricaDati();
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento registro alloggi...</p>;
  if (errore) return <p style={{ padding: '2rem', color: '#ef4444' }}>Errore: {errore}</p>;

  const costoTotale = occupazioni.reduce((acc, o) => acc + Number(o.costo_per_notte || 0), 0);
  // Nota: se non c'è una colonna 'rimborsato' nel db, gestiamo solo ciò che è "da rimborsare" attualmente
  const totaleDaSaldare = occupazioni.filter(o => o.da_rimborsare).reduce((acc, o) => acc + Number(o.costo_per_notte || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Contabilità Alloggi (Pernottamenti)</h1>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid var(--primary)', marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Valore Totale Notti</h3>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>€{costoTotale.toFixed(2)}</span>
        </div>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #ef4444', marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Quota Da Rimborsare (Ospiti)</h3>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>€{totaleDaSaldare.toFixed(2)}</span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0' }}>Registro Notti Singole</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ospite</th>
                <th>Data (Notte del)</th>
                <th>Struttura</th>
                <th>Costo Notte</th>
                <th>Stato Rimborso (Ospite)</th>
              </tr>
            </thead>
            <tbody>
              {occupazioni.map(o => (
                <tr key={o.id_occupazione}>
                  <td>
                    <strong>{o.nome_ospite} {o.cognome_ospite}</strong><br/>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.ruolo_ospite}</span>
                  </td>
                  <td>{fmtData(o.data)}</td>
                  <td><strong>{o.nome_alloggio}</strong></td>
                  <td style={{ fontWeight: 'bold' }}>€{Number(o.costo_per_notte || 0).toFixed(2)}</td>
                  <td>
                    <button 
                      onClick={() => cambiaStatoRimborso(o.id_occupazione, !o.da_rimborsare)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: o.da_rimborsare ? '#ef4444' : '#e2e8f0', color: o.da_rimborsare ? 'white' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {o.da_rimborsare ? 'Da rimborsare' : 'Costo Fondazione'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}