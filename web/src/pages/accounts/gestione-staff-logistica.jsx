import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Modal from './Modal';
import { useSortableData } from './useSortableData';

const FORM_VUOTO = {
  username: '',
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  ruolo: '',
  password: '',
};

// Ruoli che NON devono comparire qui, perché hanno già una loro pagina dedicata
const RUOLI_ESCLUSI = ['ospite', 'runner', 'giurato', 'accompagnatore'];

export default function GestioneStaffLogistica() {
  // Stati per la tabella
  const [persone, setPersone] = useState([]);
  const [ricerca, setRicerca] = useState('');
  
  // Stati per il form e il modale
  const [dati, setDati] = useState(FORM_VUOTO);
  const [ruoli, setRuoli] = useState([]);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function caricaDati() {
    // Carica la tabella
    api('/profile/elenco-staff-logistica')
      .then(setPersone)
      .catch((err) => setErrore(err.message));
  }

  useEffect(() => {
    caricaDati();
    
    // Carica i ruoli disponibili per il form
    api('/ruoli')
      .then(setRuoli)
      .catch((err) => setErrore(err.message));
  }, []);

  // Gestione form
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
      const creato = await api('/profile', {
        metodo: 'POST',
        corpo: dati,
      });
      setSuccesso(`Account creato con successo: ${creato.username}`);
      setDati(FORM_VUOTO);
      caricaDati(); // Aggiorna la tabella
      
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

  // Filtri
  const ruoliFiltrati = ruoli.filter(r => !RUOLI_ESCLUSI.includes(r.toLowerCase()));

  const personeFiltrate = persone.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome && p.nome.toLowerCase().includes(termine)) ||
      (p.cognome && p.cognome.toLowerCase().includes(termine)) ||
      (p.username && p.username.toLowerCase().includes(termine)) ||
      (p.ruolo && p.ruolo.toLowerCase().includes(termine))
    );
  });

  // Logica ordinamento
  const { items: personeOrdinate, requestSort, sortConfig } = useSortableData(personeFiltrate);

  const getSortIcon = (nomeColonna) => {
    if (!sortConfig || sortConfig.key !== nomeColonna) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Gestione Logistica e Staff</h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Cerca per nome, cognome, username o ruolo..." 
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            style={{ padding: '0.5rem', width: '100%', minWidth: '350px', borderRadius: '4px', border: '1px solid var(--border)' }}
          />
          <button 
            onClick={() => {
              setErrore('');
              setSuccesso('');
              setIsModalOpen(true);
            }} 
            style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
          >
            + Aggiungi Membro Staff
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titolo="Crea Account Staff / Logistica">
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Nome
              <input name="nome" value={dati.nome} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }} />
            </label>
            <label> Cognome
              <input name="cognome" value={dati.cognome} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Email
              <input name="email" type="email" value={dati.email} onChange={aggiorna} style={{ width: '100%', marginTop: '0.5rem' }} />
            </label>
            <label> Telefono
              <input name="telefono" type="tel" value={dati.telefono} onChange={aggiorna} style={{ width: '100%', marginTop: '0.5rem' }} />
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Username
              <input name="username" value={dati.username} onChange={aggiorna} autoComplete="off" required style={{ width: '100%', marginTop: '0.5rem' }} />
            </label>
            <label> Ruolo
              <select name="ruolo" value={dati.ruolo} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }}>
                <option value="">Scegli un ruolo...</option>
                {ruoliFiltrati.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ width: '50%' }}> Password
            <input
              name="password"
              type="password"
              value={dati.password}
              onChange={aggiorna}
              autoComplete="new-password"
              minLength={8}
              required
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
          </label>

          {errore && <p role="alert" style={{ color: '#ef4444', margin: '0.5rem 0' }}>{errore}</p>}
          {successo && <p role="status" style={{ color: '#10b981', margin: '0.5rem 0' }}>{successo}</p>}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={inInvio}>
              {inInvio ? 'Creazione in corso...' : 'Crea account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rimosso l'errore globale e spostato nel Modal (o lo lasciamo qui se riguarda il caricamento della tabella, ma l'ho rimosso per pulizia dell'interfaccia) */}
      
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('cognome')} style={{ cursor: 'pointer' }}>Cognome{getSortIcon('cognome')}</th>
                <th onClick={() => requestSort('nome')} style={{ cursor: 'pointer' }}>Nome{getSortIcon('nome')}</th>
                <th onClick={() => requestSort('username')} style={{ cursor: 'pointer' }}>Username{getSortIcon('username')}</th>
                <th onClick={() => requestSort('ruolo')} style={{ cursor: 'pointer' }}>Ruolo{getSortIcon('ruolo')}</th>
              </tr>
            </thead>
            <tbody>
              {personeOrdinate.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nessun membro dello staff logistica trovato.
                  </td>
                </tr>
              ) : (
                personeOrdinate.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.cognome}</strong></td>
                    <td><strong>{p.nome}</strong></td>
                    <td>{p.username}</td>
                    <td><span className="badge">{p.ruolo}</span></td>
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