import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  House, Bus, Ticket, BedDouble,
  FileSignature, Footprints, Users,
  Medal, Handshake, LogOut, BookUser, 
  Wallet, Star, Calculator, ChevronDown, ChevronUp,
  Utensils, UsersRound
} from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import logo from '../assets/logo-premio.png';

const GRUPPI = [
  [
    { to: '/', sardo: 'Intrada', it: 'Home', Icona: House },
    { to: '/rubrica', sardo: 'Cuntatos', it: 'Rubrica', Icona: BookUser },
  ],[  
    { to: '/gestione-alloggi', sardo: 'Aposentos', it: 'Alloggi', Icona: BedDouble },
  ],
  [
    { to: '/gestione-biglietti', sardo: 'Billetes', it: 'Biglietti', Icona: Ticket },
    { to: '/gestione-transfer', sardo: 'Tresportos', it: 'Transfer', Icona: Bus },
  ],
  [
    { 
      id: 'persone', 
      sardo: 'Pessones', 
      it: 'Persone', 
      Icona: Users,
      subItems: [
        { to: '/gestione-giurati', sardo: 'Giurados', it: 'Giurati', Icona: Medal },
        { to: '/gestione-ospiti', sardo: 'Istràngios', it: 'Ospiti', Icona: Star },
        { to: '/gestione-accompagnatori', sardo: 'Cumpàngios', it: 'Accompagnatori', Icona: Handshake },
        { to: '/gestione-runners', sardo: 'Curridores', it: 'Runners', Icona: Footprints },
        { to: '/gestione-staff-logistica', sardo: 'Istaff', it: 'Staff', Icona: UsersRound },
      ]
    }
  ],
  [
    { to: '/gestione-liberatorie', sardo: 'Firmas', it: 'Liberatorie', Icona: FileSignature },
    { to: '/gestione-buoni-pasto', sardo: 'Bones de pastu', it: 'Buoni pasto', Icona: Utensils, disabled:true },
    { to: '/gestione-ticket-teatro', sardo: 'Billetes teatru', it: 'Ticket teatro', Icona: Ticket, disabled:true },
  ],
  [
    { 
      id: 'contabilita', 
      sardo: 'Contos', 
      it: 'Contabilità', 
      Icona: Calculator,
      subItems: [
        { to: '/contabilita-rimborsi', sardo: 'Rimbursos', it: 'Rimborsi', Icona: Wallet},
        { to: '/contabilita-alloggi', sardo: 'Contos Aposentos', it: 'Alloggi', Icona: BedDouble },
        { to: '/contabilita-biglietti', sardo: 'Contos Billetes', it: 'Biglietti', Icona: Ticket },
        { to: '/contabilita/altro', sardo: 'Àteru', it: 'Altro', Icona: Wallet, disabled: true }
      ]
    }
  ]
];

// --- FOOTER SEPARATO ---
function Footer() {
  return (
    <footer style={{
      padding: '2rem 1rem',
      textAlign: 'center',
      borderTop: '1px solid rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: 'auto'
    }}>
      <img src={logo} alt="Premio Andrea Parodi" style={{ height: '50px', opacity: 0.9 }} />
      <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
        &copy; {new Date().getFullYear()} - {' '}
        <a 
          href="https://fondazioneandreaparodi.it" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Fondazione Andrea Parodi
        </a>
      </div>
    </footer>
  );
}

export default function AppLayout() {
  const { logout } = useAuth();
  const [menuAperti, setMenuAperti] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = (id) => {
    setMenuAperti(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getDisabledStyle = (isDisabled) => isDisabled ? {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
    filter: 'grayscale(100%)'
  } : {};

  // Stile per le icone della navigazione
  const iconStyle = {
    minWidth: '24px', 
    margin: isExpanded ? '0 1rem 0 0' : '0 auto', 
    transition: 'margin 0.3s ease'
  };

  return (
    <div className="app-layout">
      {/* Regola CSS iniettata per nascondere orribili scrollbar su Chrome/Safari/Edge */}
      <style>
        {`
          .no-scroll {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none;  /* IE 10+ */
          }
          .no-scroll::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Edge */
          }
        `}
      </style>
      
      {/* SIDEBAR */}
      <aside 
        className="sidebar" 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        style={{ 
          width: isExpanded ? '280px' : '80px',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <nav 
          className="no-scroll"
          style={{ 
            paddingTop: '2.5rem', 
            overflowY: 'auto', 
            flexGrow: 1 
          }}
        >
          {GRUPPI.map((gruppo, i) => (
            <div key={i} style={{ display: 'contents' }}>
              {i > 0 && <div className="motivo" aria-hidden="true" style={{ margin: '0.5rem 0' }} />}
              
              {gruppo.map((item) => {
                
                // --- SE HA UN SOTTOMENU (Tendina) ---
                if (item.subItems) {
                  const isOpen = menuAperti[item.id];
                  return (
                    <div key={item.id} className="menu-group">
                      <button 
                        className="voce-accordion" 
                        onClick={() => toggleMenu(item.id)}
                        title={!isExpanded ? item.it : undefined}
                        style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%', 
                          background: 'none', 
                          border: 'none', 
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          color: 'var(--text-color)',
                          ...getDisabledStyle(item.disabled)
                        }}
                      >
                        <item.Icona size={24} aria-hidden="true" style={iconStyle} />
                        
                        <span 
                          className="voce" 
                          style={{ 
                            flexGrow: 1, 
                            textAlign: 'left', 
                            display: 'flex', 
                            flexDirection: 'column',
                            opacity: isExpanded ? 1 : 0,
                            whiteSpace: 'nowrap',
                            transition: 'opacity 0.3s ease'
                          }}
                        >
                          <span className="voce-sardo" style={{ fontSize: '1rem', fontWeight: '500' }}>{item.sardo}</span>
                          <span className="voce-it" style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}>{item.it}</span>
                        </span>
                        
                        {isExpanded && (
                          <div style={{ minWidth: '18px' }}>
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        )}
                      </button>

                      {/* Sottomenu con animazione morbida */}
                      <div 
                        className="sub-menu" 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          maxHeight: (isOpen && isExpanded) ? '500px' : '0px',
                          opacity: (isOpen && isExpanded) ? 1 : 0,
                          visibility: (isOpen && isExpanded) ? 'visible' : 'hidden',
                          overflow: 'hidden',
                          transition: 'all 0.35s ease-in-out'
                        }}
                      >
                        {item.subItems.map((subItem) => (
                          <NavLink 
                            key={subItem.to} 
                            to={subItem.to} 
                            title={subItem.it}
                            style={{ 
                              ...getDisabledStyle(subItem.disabled), 
                              padding: '0.4rem 1rem 0.4rem 3.5rem',
                              display: 'flex', 
                              alignItems: 'center',
                              whiteSpace: 'nowrap'
                            }} 
                            className={({ isActive }) => isActive ? "active-submenu" : ""}
                          >
                            <subItem.Icona size={20} aria-hidden="true" style={{ marginRight: '0.75rem', minWidth: '20px' }} />
                            <span className="voce" style={{ display: 'flex', flexDirection: 'column' }}>
                              <span className="voce-sardo">{subItem.sardo}</span>
                              <span className="voce-it" style={{ fontSize: '0.7rem', opacity: 0.6 }}>{subItem.it}</span>
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                }

                // --- SE È UNA VOCE NORMALE ---
                return (
                  <NavLink 
                    key={item.to} 
                    to={item.to} 
                    end={item.to === '/'} 
                    title={!isExpanded ? item.it : undefined}
                    style={{ 
                      ...getDisabledStyle(item.disabled), 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '0.5rem 1rem'
                    }}
                  >
                    <item.Icona size={24} aria-hidden="true" style={iconStyle} />
                    
                    <span 
                      className="voce" 
                      style={{ 
                        flexGrow: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        opacity: isExpanded ? 1 : 0,
                        whiteSpace: 'nowrap',
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <span className="voce-sardo" style={{ fontSize: '1rem', fontWeight: '500' }}>{item.sardo}</span>
                      <span className="voce-it" style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}>{item.it}</span>
                    </span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Tasto esci con Flex-Start / Center dinamico per scavalcare la classe del tuo CSS */}
        <div className="sidebar-footer" style={{ borderTop: isExpanded ? '1px solid rgba(0,0,0,0.05)' : 'none', transition: 'all 0.3s ease' }}>
          <button 
            className="btn-esci" 
            onClick={logout} 
            title={!isExpanded ? "A si bìdere" : undefined}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: isExpanded ? 'flex-start' : 'center', // <- FIX PER IL CENTRAGGIO
              width: '100%', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'inherit',
              padding: isExpanded ? '1rem' : '1rem 0', // <- RIMOSSO PADDING LATERALE DA CHIUSO
            }}
          >
            <LogOut size={24} aria-hidden="true" style={{ 
              minWidth: '24px', 
              margin: isExpanded ? '0 1rem 0 0' : '0', // <- RIMOSSO AUTO CHE SPINGEVA A SX
              transition: 'margin 0.3s ease' 
            }} />
            
            <span style={{ 
              fontWeight: '500', 
              opacity: isExpanded ? 1 : 0,
              width: isExpanded ? 'auto' : '0', // Nasconde l'ingombro del testo quando è chiuso
              overflow: 'hidden',
              whiteSpace: 'nowrap', 
              transition: 'opacity 0.3s ease' 
            }}>
              A si bìdere
            </span>
          </button>
        </div>
      </aside>

      {/* AREA PRINCIPALE + FOOTER */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }} className="no-scroll">
        <main className="main-content" style={{ flexGrow: 1, padding: '1.5rem' }}>
          <Outlet />
        </main>
        
        <Footer />
      </div>

    </div>
  );
}