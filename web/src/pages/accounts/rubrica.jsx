import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function Rubrica() {
  const navigate = useNavigate();
  const [contatti, setContatti] = useState([]);
  const [ricerca, setRicerca] = useState('');
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    api('/profile/rubrica')
      .then(setContatti)
      .catch((err) => setErrore(err.message))
      .finally(() => setCaricamento(false));
  }, []);

  const contattiFiltrati = contatti.filter((c) => {
    const termine = ricerca.toLowerCase();
    return (
      (c.nome && c.nome.toLowerCase().includes(termine)) ||
      (c.cognome && c.cognome.toLowerCase().includes(termine)) ||
      (c.email && c.email.toLowerCase().includes(termine)) ||
      (c.telefono && c.telefono.toLowerCase().includes(termine)) ||
      (c.ruolo && c.ruolo.toLowerCase().includes(termine))
    );
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Rubrica</h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Cerca..." 
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            style={{ padding: '0.6rem 1rem', width: '100%', minWidth: '350px', borderRadius: '4px', border: '1px solid var(--border)' }}
          />
        </div>
      </div>

      {errore && <p style={{ color: '#ef4444', padding: '1rem', background: '#fef2f2', borderRadius: '8px' }}>Errore: {errore}</p>}

      <div className="card">
        {caricamento ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Caricamento rubrica...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cognome</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Profilo</th>
                </tr>
              </thead>
              <tbody>
                {contattiFiltrati.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      Nessun contatto trovato.
                    </td>
                  </tr>
                ) : (
                  contattiFiltrati.map((c, i) => (
                    <tr key={i} onClick={() => navigate(`/profile/${c.username}`)} style={{ cursor: 'pointer' }} title={`Apri profilo di ${c.username}`}>
                      <td>
                        {c.nome}
                      </td>
                    <td>{c.cognome}</td>

                     
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                          Apri ➔
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}