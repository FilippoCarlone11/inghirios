import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  House, Bus, Ticket, BedDouble,
  FileSignature, Footprints, Users,
  Medal, Handshake, LogOut, BookUser, 
  Wallet, Star, Calculator, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import logo from '../assets/logo-premio.jpg';

const GRUPPI = [
  [
    { to: '/', sardo: 'Intrada', it: 'Home', Icona: House },
    { to: '/gestione-biglietti', sardo: 'Billetes', it: 'Biglietti', Icona: Ticket },
    { to: '/gestione-alloggi', sardo: 'Domo mia', it: 'Alloggi', Icona: BedDouble },
  ],
  [
    { to: '/rubrica', sardo: 'Cuntatos', it: 'Rubrica', Icona: BookUser, disabled: true }, // Esempio di menu disabilitato
    { to: '/gestione-transfer', sardo: 'Biàgiu', it: 'Transfer', Icona: Bus },
    { to: '/gestione-liberatorie', sardo: 'Firmas', it: 'Liberatorie', Icona: FileSignature },
    { to: '/gestione-rimborsi', sardo: 'Rimbursos', it: 'Rimborsi', Icona: Wallet, disabled: true },
  ],
  [
    { to: '/gestione-giurati', sardo: 'Giurados', it: 'Giurati', Icona: Medal },
    { to: '/gestione-accompagnatori', sardo: 'Cumpanzos', it: 'Accompagnatori', Icona: Handshake },
    { to: '/gestione-ospiti', sardo: 'Istangios', it: 'Ospiti', Icona: Star },
    { to: '/gestione-runners', sardo: 'Curridores', it: 'Runners', Icona: Footprints },
    { to: '/gestione-staff-logistica', sardo: 'Sa Cumpanzia', it: 'Staff', Icona: Users },
  ],
  [
    { 
      id: 'contabilita', 
      sardo: 'Contos', 
      it: 'Contabilità', 
      Icona: Calculator,
      subItems: [
        { to: '/contabilita/alloggi', sardo: 'Contos Domo', it: 'Alloggi', Icona: BedDouble },
        { to: '/contabilita/biglietti', sardo: 'Contos Billetes', it: 'Biglietti', Icona: Ticket },
        { to: '/contabilita/altro', sardo: 'Àteru', it: 'Altro', Icona: Wallet, disabled: true } // Altro elemento disabilitato
      ]
      , disabled: true
    }
  ]
];

export default function AppLayout() {
  const { logout } = useAuth();
  const [menuAperti, setMenuAperti] = useState({});

  const toggleMenu = (id) => {
    setMenuAperti(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Funzione per generare lo stile degli elementi disabilitati
  const getDisabledStyle = (isDisabled) => isDisabled ? {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
    filter: 'grayscale(100%)'
  } : {};

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
              
              {gruppo.map((item) => {
                // Se l'elemento ha dei subItems, renderizza un bottone a tendina (Accordion)
                if (item.subItems) {
                  const isOpen = menuAperti[item.id];
                  return (
                    <div key={item.id} className="menu-group">
                      <button 
                        className="voce-accordion" 
                        onClick={() => toggleMenu(item.id)}
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%', 
                          background: 'none', 
                          border: 'none', 
                          padding: '0.75rem 1rem', 
                          cursor: 'pointer',
                          color: 'var(--text-color)',
                          ...getDisabledStyle(item.disabled)
                        }}
                      >
                        <item.Icona size={20} aria-hidden="true" style={{ marginRight: '1rem' }} />
                        <span className="voce" style={{ flexGrow: 1, textAlign: 'left' }}>
                          <span className="voce-sardo" style={{ display: 'block', fontSize: '0.8rem', opacity: 0.8 }}>{item.sardo}</span>
                          <span className="voce-it" style={{ display: 'block', fontWeight: 'bold' }}>{item.it}</span>
                        </span>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {/* Voci figlie (Sottomenu) */}
                      {isOpen && (
                        <div className="sub-menu" style={{ paddingLeft: '2.5rem', marginTop: '0.25rem' }}>
                          {item.subItems.map((subItem) => (
                            <NavLink 
                              key={subItem.to} 
                              to={subItem.to} 
                              title={subItem.it}
                              style={{ ...getDisabledStyle(subItem.disabled), display: 'flex', padding: '0.5rem 0', textDecoration: 'none', color: 'inherit' }}
                              className={({ isActive }) => isActive ? "active-submenu" : ""}
                            >
                              <subItem.Icona size={16} aria-hidden="true" style={{ marginRight: '0.75rem' }} />
                              <span className="voce">
                                <span className="voce-it">{subItem.it}</span>
                              </span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Altrimenti, renderizza un normale NavLink
                return (
                  <NavLink 
                    key={item.to} 
                    to={item.to} 
                    end={item.to === '/'} 
                    title={item.it}
                    style={getDisabledStyle(item.disabled)}
                  >
                    <item.Icona size={20} aria-hidden="true" />
                    <span className="voce">
                      <span className="voce-sardo">{item.sardo}</span>
                      <span className="voce-it">{item.it}</span>
                    </span>
                  </NavLink>
                );
              })}
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