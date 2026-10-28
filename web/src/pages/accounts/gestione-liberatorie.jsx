import { useEffect, useState } from 'react';
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

  async function toggleLiberatoria(id_giurato, statoAttuale) {
    try {
      const nuovoStato = !statoAttuale;
      await api(`/profile/modifica-liberatoria/${id_giurato}`, {
        metodo: 'PUT',
        corpo: { liberatoria_consegnata: nuovoStato }
      });
      setGiurati((prev) => 
        prev.map((g) => g.id === id_giurato ? { ...g, liberatoria_consegnata: nuovoStato } : g)
      );
    } catch (err) {
      alert("Errore nell'aggiornamento della liberatoria: " + err.message);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Gestione Liberatorie</h1>
      {errore && <p role="alert" style={{ color: '#ef4444' }}>{errore}</p>}
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Cognome</th>
                <th>Nome</th>
                <th>Username</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Tipo Giuria</th>
                <th>Partecipazione</th>
                <th style={{ textAlign: 'center' }}>Liberatoria</th>
                <th style={{ textAlign: 'center' }}>In Edizione</th>
              </tr>
            </thead>
            <tbody>
              {giurati.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.cognome}</strong></td>
                  <td><strong>{p.nome}</strong></td>
                  <td>{p.username}</td>
                  <td>{p.email || '-'}</td>
                  <td>{p.telefono || '-'}</td>
                  <td>{p.tipo_giuria || '-'}</td>
                  <td>{p.partecipazione || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => toggleLiberatoria(p.id, p.liberatoria_consegnata)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '1.2rem', backgroundColor: 'transparent', border: '1px solid var(--border)' }}
                      title={p.liberatoria_consegnata ? "Clicca per annullare" : "Clicca per confermare"}
                    >
                      {p.liberatoria_consegnata ? '✅' : '❌'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>{p.partecipa_in_questa_edizione ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}