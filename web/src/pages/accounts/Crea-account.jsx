import { useEffect, useState } from 'react';
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

  useEffect(() => {
    api('/ruoli')
      .then(setRuoli)
      .catch((err) => setErrore(err.message));
  }, []);

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
    <>
      <h1 style={{ marginBottom: '2rem' }}>Crea Nuovo Account</h1>
      
      <div className="card" style={{ maxWidth: '700px' }}>
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Nome
              <input name="nome" value={dati.nome} onChange={aggiorna} required />
            </label>
            <label> Cognome
              <input name="cognome" value={dati.cognome} onChange={aggiorna} required />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Email
              <input name="email" type="email" value={dati.email} onChange={aggiorna} />
            </label>
            <label> Telefono
              <input name="telefono" type="tel" value={dati.telefono} onChange={aggiorna} />
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Username
              <input name="username" value={dati.username} onChange={aggiorna} autoComplete="off" required />
            </label>
            <label> Ruolo
              <select name="ruolo" value={dati.ruolo} onChange={aggiorna} required>
                <option value="">Scegli un ruolo...</option>
                {ruoli.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ width: '50%' }}> Password
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

          {errore && <p role="alert" style={{ color: '#ef4444', margin: '0.5rem 0' }}>{errore}</p>}
          {successo && <p role="status" style={{ color: '#10b981', margin: '0.5rem 0' }}>{successo}</p>}

          <div style={{ marginTop: '1.5rem' }}>
            <button type="submit" disabled={inInvio}>
              {inInvio ? 'Creazione...' : 'Crea account'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}