import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Modal from './Modal';
import { useSortableData } from './useSortableData';

const FORM_VUOTO = {
  id: '',
  username: '',
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  ruolo: '',
  password: '',
};

const RUOLI_ESCLUSI = ['ospite', 'runner', 'giurato', 'accompagnatore'];

export default function GestioneStaffLogistica() {
  const [persone, setPersone] = useState([]);
  const [ricerca, setRicerca] = useState('');
  
  const [dati, setDati] = useState(FORM_VUOTO);
  const [ruoli, setRuoli] = useState([]);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  function caricaDati() {
    api('/profile/elenco-staff-logistica')
      .then(setPersone)
      .catch((err) => setErrore(err.message));
  }

  useEffect(() => {
    caricaDati();
    api('/ruoli')
      .then(setRuoli)
      .catch((err) => setErrore(err.message));
  }, []);

  function aggiorna(evento) {
    const { name, value } = evento.target;
    setDati((precedenti) => ({ ...precedenti, [name]: value }));
  }

  function apriModalModifica(membro) {
    setErrore('');
    setSuccesso('');
    setIsEditMode(true);
    setDati({
      id: membro.id,
      username: membro.username || '',
      nome: membro.nome || '',
      cognome: membro.cognome || '',
      email: membro.email || '',
      telefono: membro.telefono || '',
      ruolo: membro.ruolo || '',
      password: '',
    });
    setIsModalOpen(true);
  }

  async function elimina(id, evento) {
    evento.stopPropagation();
    if (!window.confirm('Sei sicuro di voler eliminare questo elemento? Questa azione non può essere annullata.')) {
      return;
    }
    try {
      await api(`/profile/${id}`, { metodo: 'DELETE' });
      caricaDati();
    } catch (err) {
      setErrore(`Errore durante l'eliminazione: ${err.message}`);
    }
  }

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setSuccesso('');
    setInInvio(true);
    
    const payload = { ...dati };
    if (isEditMode && !payload.password) {
      delete payload.password;
    }

    try {
      let endpoint = '/profile';
      let metodo = 'POST';

      if (isEditMode) {
        endpoint = `/profile/${dati.id}`;
        metodo = 'PUT';
      }

      await api(endpoint, {
        metodo: metodo,
        corpo: payload,
      });

      setSuccesso(`Account ${isEditMode ? 'aggiornato' : 'creato'} con successo`);
      setDati(FORM_VUOTO);
      caricaDati(); 
      
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
              setIsEditMode(false);
              setDati(FORM_VUOTO);
              setIsModalOpen(true);
            }} 
            style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
          >
            + Aggiungi Membro Staff
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titolo={isEditMode ? "Modifica Account Staff / Logistica" : "Crea Account Staff / Logistica"}>
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Nome <input name="nome" value={dati.nome} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Cognome <input name="cognome" value={dati.cognome} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Email <input name="email" type="email" value={dati.email} onChange={aggiorna} style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Telefono <input name="telefono" type="tel" value={dati.telefono} onChange={aggiorna} style={{ width: '100%', marginTop: '0.5rem' }} /></label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Username <input name="username" value={dati.username} onChange={aggiorna} autoComplete="off" required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Ruolo
              <select name="ruolo" value={dati.ruolo} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }}>
                <option value="">Scegli un ruolo...</option>
                {ruoliFiltrati.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ width: '50%' }}> Password
            <input name="password" type="password" value={dati.password} onChange={aggiorna} autoComplete="new-password" minLength={8} required={!isEditMode} style={{ width: '100%', marginTop: '0.5rem' }} />
            {isEditMode && <small style={{ color: 'var(--text-muted)' }}>Lascia vuoto per non modificare</small>}
          </label>

          {errore && <p role="alert" style={{ color: '#ef4444', margin: '0.5rem 0' }}>{errore}</p>}
          {successo && <p role="status" style={{ color: '#10b981', margin: '0.5rem 0' }}>{successo}</p>}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={inInvio}>
              {inInvio ? 'Salvataggio...' : (isEditMode ? 'Salva Modifiche' : 'Crea account')}
            </button>
          </div>
        </form>
      </Modal>

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
                <th onClick={() => requestSort('ruolo')} style={{ cursor: 'pointer' }}>Ruolo{getSortIcon('ruolo')}</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {personeOrdinate.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Nessun membro dello staff logistica trovato.</td></tr>
              ) : (
                personeOrdinate.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/profile/${p.username}`)}>
                    <td><strong>{p.cognome}</strong></td>
                    <td><strong>{p.nome}</strong></td>
                    <td>{p.username}</td>
                    <td>{p.email || '-'}</td>
                    <td>{p.telefono || '-'}</td>
                    <td><span className="badge">{p.ruolo}</span></td>
                    <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => apriModalModifica(p)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }}>✎</button>
                      <button onClick={(e) => elimina(p.id, e)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.2rem 0.5rem' }}>✕</button>
                    </td>
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