import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    <main>
      <p>
        <Link to="/">← Indietro</Link>
      </p>
      <h1>Gestione Giurati</h1>
      {errore && <p role="alert">{errore}</p>}
      
      <div style={{ overflowX: 'auto' }}>
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
              <th>Liberatoria</th>
              <th>In Edizione</th>
            </tr>
          </thead>
          <tbody>
            {giurati.map((p) => (
              <tr key={p.id}>
                <td>{p.cognome}</td>
                <td>{p.nome}</td>
                <td>{p.username}</td>
                <td>{p.email || '-'}</td>
                <td>{p.telefono || '-'}</td>
                
                {/* Dati specifici del giurato */}
                <td>{p.tipo_giuria || '-'}</td>
                <td>{p.partecipazione || '-'}</td>
                <td>{p.emittente || '-'}</td>
                <td>{p.mezzo_di_informazione || '-'}</td>
                
                {/* Booleani formattati visivamente */}
                <td style={{ textAlign: 'center' }}>
                  {p.liberatoria_consegnata ? '✅' : '❌'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {p.partecipa_in_questa_edizione ? '✅' : '❌'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}