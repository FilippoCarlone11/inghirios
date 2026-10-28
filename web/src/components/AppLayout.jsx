import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx'; // Adegua il percorso se necessario

export default function AppLayout() {
  const { logout } = useAuth(); // Se hai la funzione di logout nel context

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Inghirios</h2>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/gestione-transfer">Transfer</Link>
          <Link to="/gestione-biglietti">Biglietti</Link>
          <Link to="/gestione-alloggi">Alloggi</Link>
          
          <hr style={{ borderTop: '1px solid #334155', width: '100%', margin: '1rem 0' }} />
          
          <Link to="/gestione-giurati">Giurati</Link>
          <Link to="/gestione-liberatorie">Liberatorie</Link>
          <Link to="/gestione-runners">Runners</Link>
          <Link to="/gestione-staff-logistica">Staff Logistica</Link>
          
          <hr style={{ borderTop: '1px solid #334155', width: '100%', margin: '1rem 0' }} />
          
          <Link to="/crea-account">Crea Account</Link>
          <Link to="/crea-giurato">Crea Giurato</Link>
          <Link to="/crea-accompagnatore">Crea Accompagnatore</Link>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button className="btn-secondary" style={{ width: '100%', backgroundColor: '#ef4444', color: 'white', border: 'none' }} onClick={logout}>
            Esci
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}