import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext.jsx';


export default function Home() {
  const { utente } = useAuth();
  const [gruppiWhatsapp, setGruppiWhatsapp] = useState([]);

  useEffect(() => {
    // Sostituisci con la vera chiamata API in futuro
    const datiSimulati = [
      { id: 1, tipologia: 'Logistica', url: 'https://chat.whatsapp.com/FTt4lCQgQ4S0WDtGXiX23c' },
      { id: 2, tipologia: 'Giuria internazionale', url: '#' },
      { id: 3, tipologia: 'Giuria critica', url: '#' },
    ];
    setGruppiWhatsapp(datiSimulati);
  }, []);

  return (
    <main className="main-content">
      <header style={{ marginBottom: '2rem' }}>
        <h1>Benvenuto, {utente.nome}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '-1rem' }}>
          Sei collegato con il ruolo di <strong>{utente.ruolo}</strong>.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Card Siti Ufficiali */}
        <div className="card">
          <h2>Siti Ufficiali</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <a href="https://www.premioandreaparodi.it" target="_blank" rel="noopener noreferrer" className="btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Premio Andrea Parodi
            </a>
            <a href="https://www.fondazioneandreaparodi.it" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Fondazione Andrea Parodi
            </a>
          </div>
        </div>

        {/* Card Gruppi WhatsApp */}
        <div className="card">
          <h2>Gruppi WhatsApp</h2>
          {gruppiWhatsapp.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              {gruppiWhatsapp.map((gruppo) => (
                <a key={gruppo.id} href={gruppo.url} target="_blank" rel="noopener noreferrer"  className="btn"
                   style={{ textAlign: 'center', textDecoration: 'none' }}>
                   Gruppo {gruppo.tipologia}
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Nessun gruppo disponibile.</p>
          )}
        </div>
      </div>

      {/* Sezione Video Serate */}
      <section>
        <h2 style={{ marginBottom: '1.5rem' }}>Le Serate in Diretta</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Prima Serata</h3>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <iframe width="100%" height="220" src="https://www.youtube.com/embed/LtVPMZU8G7E" title="Prima Serata" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </div>

          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Seconda Serata</h3>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <iframe width="100%" height="220" src="https://www.youtube.com/embed/7YP2GTJNhE8" title="Seconda Serata" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </div>

          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Terza Serata</h3>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <iframe width="100%" height="220" src="https://www.youtube.com/embed/UZ_ILX1flzo" title="Terza Serata" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}