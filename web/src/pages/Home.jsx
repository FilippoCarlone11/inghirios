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
          <Link to="/crea-giurato">Creazione giurato</Link>
        </p>
        <p>
          <Link to="/gestione-staff-logistica">Gestione staff logistica</Link>
        </p>
        <p>
          <Link to="/gestione-giurati">Gestione giurati</Link>
        </p>
        <p>
          <Link to="/gestione-runners">Gestione runners</Link>
        </p>
        <p>
          <Link to="/gestione-biglietti">Gestione biglietti</Link>
        </p>
        <p>
          <Link to="/gestione-transfer">Gestione transfer</Link>
        </p>
        <p>
          <Link to="/gestione-liberatorie">Gestione liberatorie</Link>
        </p>
        <p>
          <Link to="/gestione-alloggi">Gestione alloggi</Link>
        </p>
        
        </>
        
      )}
      <button onClick={logout}>Esci</button>
    </main>
  );
}