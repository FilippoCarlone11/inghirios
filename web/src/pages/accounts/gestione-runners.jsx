import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

export default function GestioneRunners() {
  const [persone, setPersone] = useState([]);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    api('/profile/elenco-runners')
      .then(setPersone)
      .catch((err) => setErrore(err.message));
  }, []);

  return (
    <main>
      <p>
        <Link to="/">← Indietro</Link>
      </p>
      <h1>Runners</h1>
      {errore && <p role="alert">{errore}</p>}
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
              <td>{p.cognome}</td>
              <td>{p.nome}</td>
              <td>{p.username}</td>
              <td>{p.ruolo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}