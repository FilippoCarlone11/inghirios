import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

const FORM_VUOTO = {
  username: '',
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  ruolo: '',
  password: '',
};

export default function CreaAccount() {
  const [dati, setDati] = useState(FORM_VUOTO);
  const [ruoli, setRuoli] = useState([]);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);

  // Carica l'elenco dei ruoli dal server, così non è scritto anche qui
  useEffect(() => {
    api('/ruoli')
      .then(setRuoli)
      .catch((err) => setErrore(err.message));
  }, []);

  // Un'unica funzione per tutti i campi: usa il "name" dell'input
  function aggiorna(evento) {
    const { name, value } = evento.target;
    setDati((precedenti) => ({ ...precedenti, [name]: value }));
  }

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setSuccesso('');
    setInInvio(true);
    try {
      const creato = await api('/profile', {
        metodo: 'POST',
        corpo: dati,
      });
      setSuccesso(`Account creato: ${creato.username}`);
      setDati(FORM_VUOTO);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  return (
    <main>
      <p>
        <Link to="/">← Indietro</Link>
      </p>
      <h1>Crea account</h1>
      <form onSubmit={invia}>
        <label>
          Username
          <input
            name="username"
            value={dati.username}
            onChange={aggiorna}
            autoComplete="off"
            required
          />
        </label>
        <label>
          Nome
          <input name="nome" value={dati.nome} onChange={aggiorna} required />
        </label>
        <label>
          Cognome
          <input name="cognome" value={dati.cognome} onChange={aggiorna} required />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={dati.email}
            onChange={aggiorna}
          />
        </label>
        <label>
          Telefono
          <input
            name="telefono"
            type="tel"
            value={dati.telefono}
            onChange={aggiorna}
          />
        </label>
        <label>
          Ruolo
          <select name="ruolo" value={dati.ruolo} onChange={aggiorna} required>
            <option value="">Scegli un ruolo</option>
            {ruoli.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={dati.password}
            onChange={aggiorna}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {errore && <p role="alert">{errore}</p>}
        {successo && <p role="status">{successo}</p>}

        <button type="submit" disabled={inInvio}>
          {inInvio ? 'Creazione...' : 'Crea account'}
        </button>
      </form>
    </main>
  );
}