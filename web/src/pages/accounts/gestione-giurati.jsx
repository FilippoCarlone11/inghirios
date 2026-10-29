import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import Modal from './Modal'; // <-- Modifica il percorso se necessario
import { useSortableData } from './useSortableData'; // <-- Modifica il percorso se necessario

const FORM_VUOTO = {
  username: '',
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  password: '',
  tipo_giudice: '',
  tipo_partecipazione: '',
  emittente: '',
  mezzo_di_informazione: '',
};

export default function GestioneGiurati() {
  const navigate = useNavigate();
  
  // Stati del form
  const [dati, setDati] = useState(FORM_VUOTO);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  
  // Stati dell'elenco
  const [giurati, setGiurati] = useState([]);
  const [ricerca, setRicerca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Stato per il popup

  function caricaGiurati() {
    api('/profile/elenco-giurati')
      .then(setGiurati)
      .catch((err) => setErrore(err.message));
  }

  useEffect(() => {
    caricaGiurati();
  }, []);

  function aggiorna(evento) {
    const { name, value } = evento.target;
    setDati((precedenti) => ({ ...precedenti, [name]: value }));
  }

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setSuccesso('');
    setInInvio(true);
    
    try {
      const creato = await api('/profile/aggiungi-giurato', {
        metodo: 'POST',
        corpo: dati,
      });
      setSuccesso(`Giurato creato con successo: ${creato.persona.username}`);
      setDati(FORM_VUOTO);
      caricaGiurati(); 
      
      // Chiude il popup automaticamente dopo il successo
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccesso('');
      }, 1500);

    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  // Filtro ricerca
  const giuratiFiltrati = giurati.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome && p.nome.toLowerCase().includes(termine)) ||
      (p.cognome && p.cognome.toLowerCase().includes(termine)) ||
      (p.username && p.username.toLowerCase().includes(termine))
    );
  });

  // Logica ordinamento
  const { items: giuratiOrdinati, requestSort, sortConfig } = useSortableData(giuratiFiltrati);

  const getSortIcon = (nomeColonna) => {
    if (!sortConfig || sortConfig.key !== nomeColonna) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      {/* HEADER CON TITOLO E STRUMENTI (RICERCA + PULSANTE) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Gestione Giurati</h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Cerca per nome, cognome o username..." 
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            style={{ padding: '0.5rem', width: '100%', minWidth: '300px', borderRadius: '4px', border: '1px solid var(--border)' }}
          />
          <button 
            onClick={() => {
              setErrore('');
              setSuccesso('');
              setIsModalOpen(true);
            }} 
            style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
          >
            + Aggiungi Giurato
          </button>
        </div>
      </div>

      {/* POPUP PER LA CREAZIONE GIURATO */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titolo="Aggiungi Nuovo Giurato">
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column' }}>
          
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            Dati Personali
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <label> Nome <input name="nome" value={dati.nome} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Cognome <input name="cognome" value={dati.cognome} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Email <input name="email" type="email" value={dati.email} onChange={aggiorna} style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Telefono <input name="telefono" type="tel" value={dati.telefono} onChange={aggiorna} style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Username <input name="username" value={dati.username} onChange={aggiorna} autoComplete="off" required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Password <input name="password" type="password" value={dati.password} onChange={aggiorna} autoComplete="new-password" minLength={8} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
          </div>

          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            Dettagli Giuria
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <label> Tipologia Giudice
              <select name="tipo_giudice" value={dati.tipo_giudice} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }}>
                <option value="">Seleziona...</option>
                <option value="critica">Critica (Tecnico)</option>
                <option value="internazionale">Internazionale (Popolare)</option>
                <option value="tecnica">Tecnica</option>
              </select>
            </label>
            <label> Tipologia Partecipazione
              <select name="tipo_partecipazione" value={dati.tipo_partecipazione} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }}>
                <option value="">Seleziona...</option>
                <option value="in loco">In loco</option>
                <option value="da remoto">Da remoto</option>
              </select>
            </label>
            <label> Emittente <input name="emittente" value={dati.emittente} onChange={aggiorna} style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Mezzo di Info <input name="mezzo_di_informazione" value={dati.mezzo_di_informazione} onChange={aggiorna} style={{ width: '100%', marginTop: '0.5rem' }} /></label>
          </div>

          {errore && <p style={{ color: '#ef4444', marginTop: '1.5rem', marginBottom: 0 }} role="alert">{errore}</p>}
          {successo && <p style={{ color: '#10b981', marginTop: '1.5rem', marginBottom: 0 }} role="status">{successo}</p>}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={inInvio} style={{ minWidth: '150px' }}>
              {inInvio ? 'Creazione in corso...' : 'Crea Giurato'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TABELLA CON COLONNE ORDINABILI */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('cognome')} style={{ cursor: 'pointer' }}>Cognome{getSortIcon('cognome')}</th>
                <th onClick={() => requestSort('nome')} style={{ cursor: 'pointer' }}>Nome{getSortIcon('nome')}</th>
                <th onClick={() => requestSort('username')} style={{ cursor: 'pointer' }}>Username{getSortIcon('username')}</th>
                <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>Email{getSortIcon('email')}</th>
                <th onClick={() => requestSort('telefono')} style={{ cursor: 'pointer' }}>Telefono{getSortIcon('telefono')}</th>
                <th onClick={() => requestSort('tipo_giuria')} style={{ cursor: 'pointer' }}>Tipo Giuria{getSortIcon('tipo_giuria')}</th>
                <th onClick={() => requestSort('partecipazione')} style={{ cursor: 'pointer' }}>Partecipazione{getSortIcon('partecipazione')}</th>
                <th onClick={() => requestSort('emittente')} style={{ cursor: 'pointer' }}>Emittente{getSortIcon('emittente')}</th>
                <th onClick={() => requestSort('mezzo_di_informazione')} style={{ cursor: 'pointer' }}>Mezzo di Info{getSortIcon('mezzo_di_informazione')}</th>
                <th onClick={() => requestSort('liberatoria_consegnata')} style={{ cursor: 'pointer', textAlign: 'center' }}>Liberatoria{getSortIcon('liberatoria_consegnata')}</th>
                <th onClick={() => requestSort('partecipa_in_questa_edizione')} style={{ cursor: 'pointer', textAlign: 'center' }}>In Edizione{getSortIcon('partecipa_in_questa_edizione')}</th>
              </tr>
            </thead>
            <tbody>
              {giuratiOrdinati.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nessun giurato trovato.
                  </td>
                </tr>
              ) : (
                giuratiOrdinati.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => navigate(`/profile/${p.id}`)}
                    style={{ cursor: 'pointer' }}
                    title="Clicca per visualizzare il profilo"
                  >
                    <td><strong>{p.cognome}</strong></td>
                    <td><strong>{p.nome}</strong></td>
                    <td>{p.username}</td>
                    <td>{p.email || '-'}</td>
                    <td>{p.telefono || '-'}</td>
                    <td>{p.tipo_giuria || '-'}</td>
                    <td>{p.partecipazione || '-'}</td>
                    <td>{p.emittente || '-'}</td>
                    <td>{p.mezzo_di_informazione || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{p.liberatoria_consegnata ? '✅' : '❌'}</td>
                    <td style={{ textAlign: 'center' }}>{p.partecipa_in_questa_edizione ? '✅' : '❌'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}