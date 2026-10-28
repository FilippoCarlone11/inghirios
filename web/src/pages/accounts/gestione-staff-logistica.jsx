import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function GestioneRunners() {
  const [persone, setPersone] = useState([]);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    api('/profile/elenco-staff-logistica')
      .then(setPersone)
      .catch((err) => setErrore(err.message));
  }, []);

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Logistica</h1>
      {errore && <p role="alert" style={{ color: '#ef4444' }}>{errore}</p>}
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Cognome</th>
                <th>Nome</th>
                <th>Username</th>
                <th>Ruolo</th>
              </tr>
            </thead>
            <tbody>
              {persone.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.cognome}</strong></td>
                  <td><strong>{p.nome}</strong></td>
                  <td>{p.username}</td>
                  <td><span className="badge">{p.ruolo}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}