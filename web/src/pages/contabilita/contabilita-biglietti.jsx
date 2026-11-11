import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { formattaEnum, fmtData } from '../utils.js';

export default function ContabilitaBiglietti() {
  const [biglietti, setBiglietti] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');

  const caricaDati = () => {
    api('/biglietti/elenco-biglietti')
      .then(setBiglietti)
      .catch(err => setErrore(err.message))
      .finally(() => setCaricamento(false));
  };

  useEffect(() => {
    setCaricamento(true);
    caricaDati();
  }, []);

  const cambiaStatoRimborso = async (id, stato) => {
    try {
      await api(`/biglietti/cambia-stato-rimborso/${id}`, { metodo: 'PATCH', corpo: { stato } });
      caricaDati();
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento registro biglietti...</p>;
  if (errore) return <p style={{ padding: '2rem', color: '#ef4444' }}>Errore: {errore}</p>;

  // Filtriamo i biglietti che rientrano nelle logiche di rimborso all'ospite
  const bigliettiRimborsabili = biglietti.filter(b => b.stato === 'rimborso_richiesto' || b.stato === 'rimborso_ottenuto' || b.da_rimborsare_ospite);

  const costoTotale = biglietti.reduce((acc, b) => acc + Number(b.costo || 0), 0);
  const totaleDaSaldare = bigliettiRimborsabili.filter(b => b.stato !== 'rimborso_ottenuto').reduce((acc, b) => acc + Number(b.costo || 0), 0);
  const totaleSaldato = bigliettiRimborsabili.filter(b => b.stato === 'rimborso_ottenuto').reduce((acc, b) => acc + Number(b.costo || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Contabilità Biglietti</h1>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid var(--primary)', marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Costo Totale Viaggi</h3>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>€{costoTotale.toFixed(2)}</span>
        </div>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #ef4444', marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Rimborso Da Saldare</h3>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>€{totaleDaSaldare.toFixed(2)}</span>
        </div>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #10b981', marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>Rimborsi Pagati</h3>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>€{totaleSaldato.toFixed(2)}</span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0' }}>Registro Operazioni</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Passeggero</th>
                <th>Data Volo</th>
                <th>Tratta</th>
                <th>Codici</th>
                <th>Costo</th>
                <th>Stato Rimborso (Ospite)</th>
              </tr>
            </thead>
            <tbody>
              {biglietti.map(b => {
                const rimborsabile = b.stato === 'rimborso_richiesto' || b.stato === 'rimborso_ottenuto' || b.da_rimborsare_ospite;
                const rimborsato = b.stato === 'rimborso_ottenuto';

                return (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.nome} {b.cognome}</strong><br/>
                      {b.username && <Link to={`/profilo/${b.username}`} style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Vedi profilo</Link>}
                    </td>
                    <td>{fmtData(b.orario_partenza_previsto) || '-'}</td>
                    <td><strong>{b.partenza}</strong> → <strong>{b.arrivo}</strong><br/><span style={{ fontSize: '0.8rem' }}>{formattaEnum(b.compagnia)}</span></td>
                    <td><span className="bg-chip">{b.codice_prenotazione || b.codice_volo || 'N/D'}</span></td>
                    <td style={{ fontWeight: 'bold' }}>€{Number(b.costo || 0).toFixed(2)}</td>
                    <td>
                      {!rimborsabile ? (
                        <span style={{ color: 'var(--text-muted)' }}>Pagato dall'Org.</span>
                      ) : (
                        <button 
                          onClick={() => cambiaStatoRimborso(b.id, rimborsato ? 'rimborso_richiesto' : 'rimborso_ottenuto')}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: rimborsato ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          {rimborsato ? 'Rimborsato' : 'Da rimborsare'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}