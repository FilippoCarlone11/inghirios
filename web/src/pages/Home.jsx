import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Home() {
  const { utente, logout } = useAuth();

  return (
    <main>
      <h1>inghirios</h1>
      <p>
        Ciao {utente.nome}, sei collegato come {utente.ruolo}.
      </p>
      {utente.ruolo === 'admin' && (
        <>
        <p>
          <Link to="/crea-account">Creazione account</Link>
        </p>
        <p>
          <Link to="/persone">Gestione staff logistica</Link>
        </p>
        <p>
          <Link to="/persone">Gestione giurati</Link>
        </p>
        <p>
          <Link to="/persone">Gestione runners</Link>
        </p>
        
        </>
        
      )}
      <button onClick={logout}>Esci</button>
    </main>
  );
}