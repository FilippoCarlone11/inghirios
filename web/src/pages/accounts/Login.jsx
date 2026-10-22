import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';

export default function Login() {
  const { utente, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [inInvio, setInInvio] = useState(false);

  if (utente) return <Navigate to="/" replace />;

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setInInvio(true);
    try {
      await login(username, password);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  return (
    <main>
      <h1>inghirios</h1>
      <form onSubmit={invia}>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {errore && <p role="alert">{errore}</p>}
        <button type="submit" disabled={inInvio}>
          {inInvio ? 'Accesso...' : 'Accedi'}
        </button>
      </form>
    </main>
  );
}