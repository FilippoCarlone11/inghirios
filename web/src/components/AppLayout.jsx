import { NavLink, Outlet } from 'react-router-dom';
import {
  House, Bus, Ticket, BedDouble,
  Award, FileSignature, Footprints, Users,
  UserPlus, Medal, Handshake, LogOut
} from 'lucide-react';
import { useAuth } from '../AuthContext.jsx'; // Adegua il percorso se necessario
import logo from '../assets/logo-premio.jpg'; // Metti il file in src/assets (adegua il percorso se necessario)

// Voci del menu: nome in sardo, spiegazione in italiano, icona.
// Tre gruppi, separati da una fila di rombi.
const GRUPPI = [
  [
    { to: '/',                  sardo: 'Intrada',      it: 'Home',       Icona: House },
    { to: '/gestione-biglietti',sardo: 'Billetes',     it: 'Biglietti',  Icona: Ticket },
    { to: '/gestione-alloggi',  sardo: 'Domo mia',     it: 'Alloggi',    Icona: BedDouble },
  ],
  [
    { to: '/gestione-transfer', sardo: 'Biàgiu',       it: 'Transfer',   Icona: Bus },
    { to: '/rubrica',        sardo: 'Sa Giuria',     it: 'Rubrica',        Icona: Award },
    { to: '/gestione-liberatorie',    sardo: 'Firmas',        it: 'Liberatorie',    Icona: FileSignature },
    { to: '/gestione-rimborsi',    sardo: 'Firmas',        it: 'Rimborsi',    Icona: FileSignature },
  ],
  [
    
    { to: '/gestione-giurati',       sardo: 'Giuradu',  it: 'Giurati',       Icona: Medal },
    { to: '/gestione-accompagnatori',sardo: 'Cumpanzu', it: 'Accompagnatori',Icona: Handshake },
    { to: '/gestione-ospiti',       sardo: 'Ospiti',  it: 'Ospiti',       Icona: Medal },
    { to: '/gestione-runners',       sardo: 'Curridores',    it: 'Runners',       Icona: UserPlus },
    { to: '/gestione-staff-logistica',sardo: 'Sa Cumpanzia',  it: 'Staff',Icona: Users },
    
  ]
];

export default function AppLayout() {
  const { logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="19° Premio Andrea Parodi 2026" />
          <h2>Inghirios</h2>
        </div>

        <nav>
          {GRUPPI.map((gruppo, i) => (
            <div key={i} style={{ display: 'contents' }}>
              {i > 0 && <div className="motivo" aria-hidden="true" />}
              {gruppo.map(({ to, sardo, it, Icona }) => (
                <NavLink key={to} to={to} end={to === '/'} title={it}>
                  <Icona size={20} aria-hidden="true" />
                  <span className="voce">
                    <span className="voce-sardo">{sardo}</span>
                    <span className="voce-it">{it}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-esci" onClick={logout}>
            <LogOut size={18} aria-hidden="true" />
            A si bìdere
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}