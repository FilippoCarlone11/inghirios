import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

export default function GestioneRimborsi() {
  const [dati, setDati] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    api('/profile/riepilogo-rimborsi')
      .then(setDati)
      .catch(err => setErrore(err.message))
      .finally(() => setCaricamento(false));
  }, []);

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento rimborsi in corso...</p>;
  if (errore) return <p style={{ padding: '2rem', color: '#ef4444' }}>Errore: {errore}</p>;

  // Filtra chi deve ricevere ancora qualcosa e chi ha completato tutto
  const daRimborsare = dati.filter(u => Number(u.totale_da_rimborsare) > 0);
  const completati = dati.filter(u => Number(u.totale_da_rimborsare) === 0 && Number(u.totale_completato) > 0);

  // Calcoli per i banner in alto
  const sommaDaSaldare = daRimborsare.reduce((acc, u) => acc + Number(u.totale_da_rimborsare), 0);
  const sommaGiaPagata = dati.reduce((acc, u) => acc + Number(u.totale_completato), 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Riepilogo Rimborsi</h1>

      {/* BANNER TOTALI GENERALI */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #ef4444', marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Da Saldare Totale</h3>
          <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>€{sommaDaSaldare.toFixed(2)}</span>
        </div>
        <div className="card" style={{ flex: 1, borderLeft: '4px solid #10b981', marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>Erogati Totale</h3>
          <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>€{sommaGiaPagata.toFixed(2)}</span>
        </div>
      </div>

      {/* SEZIONE: DA RIMBORSARE */}
      <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid #ef4444' }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>In Attesa di Rimborso ({daRimborsare.length})</h2>
        {daRimborsare.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nessun rimborso pendente al momento.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Utente</th>
                  <th>Ruolo</th>
                  <th>Da Saldare</th>
                  <th>Già Erogato</th>
                  <th style={{ textAlign: 'right' }}>Azione</th>
                </tr>
              </thead>
              <tbody>
                {daRimborsare.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.nome} {u.cognome}</strong><br/><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username}</span></td>
                    <td><span className="badge">{u.ruolo.toUpperCase()}</span></td>
                    <td style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>€{Number(u.totale_da_rimborsare).toFixed(2)}</td>
                    <td style={{ color: '#64748b' }}>€{Number(u.totale_completato).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/profile/${u.username}`} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Vedi Dettaglio
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SEZIONE: COMPLETATI */}
      <div className="card" style={{ borderTop: '4px solid #10b981' }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>Rimborsi Completati ({completati.length})</h2>
        {completati.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nessun utente ha rimborsi completamente saldati.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Utente</th>
                  <th>Ruolo</th>
                  <th>Totale Erogato</th>
                  <th style={{ textAlign: 'right' }}>Azione</th>
                </tr>
              </thead>
              <tbody>
                {completati.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.nome} {u.cognome}</strong><br/><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username}</span></td>
                    <td><span className="badge">{u.ruolo.toUpperCase()}</span></td>
                    <td style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>€{Number(u.totale_completato).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/profile/${u.username}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Storico
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}