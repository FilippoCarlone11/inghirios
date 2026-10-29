import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useSortableData } from './useSortableData';

export default function GestioneRunners() {
  const [persone, setPersone] = useState([]);
  const [errore, setErrore] = useState('');
  const [ricerca, setRicerca] = useState('');

  useEffect(() => {
    api('/profile/elenco-runners')
      .then(setPersone)
      .catch((err) => setErrore(err.message));
  }, []);

  // Filtro ricerca
  const personeFiltrate = persone.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome && p.nome.toLowerCase().includes(termine)) ||
      (p.cognome && p.cognome.toLowerCase().includes(termine)) ||
      (p.username && p.username.toLowerCase().includes(termine)) ||
      (p.ruolo && p.ruolo.toLowerCase().includes(termine))
    );
  });

  // Logica ordinamento
  const { items: personeOrdinate, requestSort, sortConfig } = useSortableData(personeFiltrate);

  const getSortIcon = (nomeColonna) => {
    if (!sortConfig || sortConfig.key !== nomeColonna) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Gestione Runners</h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Cerca per nome, cognome, username o ruolo..." 
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            style={{ padding: '0.5rem', width: '100%', minWidth: '350px', borderRadius: '4px', border: '1px solid var(--border)' }}
          />
          {/* Se un giorno servirà creare un runner:
          <button onClick={() => setIsModalOpen(true)} style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>
            + Aggiungi Runner
          </button> 
          */}
        </div>
      </div>

      {errore && <p role="alert" style={{ color: '#ef4444' }}>{errore}</p>}
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('cognome')} style={{ cursor: 'pointer' }}>Cognome{getSortIcon('cognome')}</th>
                <th onClick={() => requestSort('nome')} style={{ cursor: 'pointer' }}>Nome{getSortIcon('nome')}</th>
                <th onClick={() => requestSort('username')} style={{ cursor: 'pointer' }}>Username{getSortIcon('username')}</th>
              </tr>
            </thead>
            <tbody>
              {personeOrdinate.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nessun runner trovato.
                  </td>
                </tr>
              ) : (
                personeOrdinate.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.cognome}</strong></td>
                    <td><strong>{p.nome}</strong></td>
                    <td>{p.username}</td>
                  
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}