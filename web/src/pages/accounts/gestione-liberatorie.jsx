import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

export default function GestioneLiberatorie() {
  const [giurati, setGiurati] = useState([]);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    caricaGiurati();
  }, []);

  function caricaGiurati() {
    api('/profile/elenco-giurati')
      .then(setGiurati)
      .catch((err) => setErrore(err.message));
  }

  // Funzione per gestire il click sulla liberatoria
  async function toggleLiberatoria(id_giurato, statoAttuale) {
    try {
      const nuovoStato = !statoAttuale;
      
      // Chiamata API per aggiornare il dato nel database.
      // Assicurati di avere o creare questa rotta nel tuo backend!
      await api(`/profile/modifica-liberatoria/${id_giurato}`, {
        metodo: 'PUT',
        corpo: { liberatoria_consegnata: nuovoStato }
      });

      // Aggiorniamo lo stato locale per far cambiare l'icona immediatamente 
      // senza dover ricaricare la pagina
      setGiurati((prev) => 
        prev.map((g) => 
          g.id === id_giurato ? { ...g, liberatoria_consegnata: nuovoStato } : g
        )
      );
    } catch (err) {
      alert("Errore nell'aggiornamento della liberatoria: " + err.message);
    }
  }

  return (
    <main style={{ padding: '1rem' }}>
      <p>
        <Link to="/">← Indietro</Link>
      </p>
      <h1>Gestione Giurati</h1>
      {errore && <p role="alert" style={{ color: 'red' }}>{errore}</p>}
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4' }}>
              <th style={{ padding: '10px' }}>Cognome</th>
              <th style={{ padding: '10px' }}>Nome</th>
              <th style={{ padding: '10px' }}>Username</th>
              <th style={{ padding: '10px' }}>Email</th>
              <th style={{ padding: '10px' }}>Telefono</th>
              <th style={{ padding: '10px' }}>Tipo Giuria</th>
              <th style={{ padding: '10px' }}>Partecipazione</th>
              <th style={{ padding: '10px' }}>Emittente</th>
              <th style={{ padding: '10px' }}>Mezzo di Info</th>
              <th style={{ padding: '10px' }}>Liberatoria</th>
              <th style={{ padding: '10px' }}>In Edizione</th>
            </tr>
          </thead>
          <tbody>
            {giurati.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{p.cognome}</td>
                <td style={{ padding: '10px' }}>{p.nome}</td>
                <td style={{ padding: '10px' }}>{p.username}</td>
                <td style={{ padding: '10px' }}>{p.email || '-'}</td>
                <td style={{ padding: '10px' }}>{p.telefono || '-'}</td>
                
                {/* Dati specifici del giurato */}
                <td style={{ padding: '10px' }}>{p.tipo_giuria || '-'}</td>
                <td style={{ padding: '10px' }}>{p.partecipazione || '-'}</td>
                <td style={{ padding: '10px' }}>{p.emittente || '-'}</td>
                <td style={{ padding: '10px' }}>{p.mezzo_di_informazione || '-'}</td>
                
                {/* Booleano interattivo per la liberatoria */}
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button 
                    onClick={() => toggleLiberatoria(p.id, p.liberatoria_consegnata)}
                    style={{
                      background: 'none',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                    title={p.liberatoria_consegnata ? "Clicca per annullare" : "Clicca per confermare"}
                  >
                    {p.liberatoria_consegnata ? '✅' : '❌'}
                  </button>
                </td>
                
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  {p.partecipa_in_questa_edizione ? '✅' : '❌'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}