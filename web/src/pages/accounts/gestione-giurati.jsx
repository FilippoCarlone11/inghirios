import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function GestioneGiurati() {
  const [giurati, setGiurati] = useState([]);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    api('/profile/elenco-giurati')
      .then(setGiurati)
      .catch((err) => setErrore(err.message));
  }, []);

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Gestione Giurati</h1>
      {errore && <p role="alert" style={{ color: '#ef4444' }}>{errore}</p>}
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Cognome</th>
                <th>Nome</th>
                <th>Username</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Tipo Giuria</th>
                <th>Partecipazione</th>
                <th>Emittente</th>
                <th>Mezzo di Info</th>
                <th style={{ textAlign: 'center' }}>Liberatoria</th>
                <th style={{ textAlign: 'center' }}>In Edizione</th>
              </tr>
            </thead>
            <tbody>
              {giurati.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.cognome}</strong></td>
                  <td><strong>{p.nome}</strong></td>
                  <td>{p.username}</td>
                  <td>{p.email || '-'}</td>
                  <td>{p.telefono || '-'}</td>
                  <td>{p.tipo_giuria || '-'}</td>
                  <td>{p.partecipazione || '-'}</td>
                  <td>{p.emittente || '-'}</td>
                  <td>{p.mezzo_di_informazione || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{p.liberatoria_consegnata ? '✅' : '❌'}</td>
                  <td style={{ textAlign: 'center' }}>{p.partecipa_in_questa_edizione ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}