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
  password: '',
  ruolo: 'runner',
};

export default function GestioneRunners() {
  const [persone, setPersone] = useState([]);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [ricerca, setRicerca] = useState('');
  
  const [dati, setDati] = useState(FORM_VUOTO);
  const [inInvio, setInInvio] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  function caricaDati() {
    api('/profile/elenco-runners')
      .then(setPersone)
      .catch((err) => setErrore(err.message));
  }

  useEffect(() => { caricaDati(); }, []);

  function aggiorna(evento) {
    const { name, value } = evento.target;
    setDati((precedenti) => ({ ...precedenti, [name]: value }));
  }

  function apriModalModifica(runner) {
    setErrore('');
    setSuccesso('');
    setIsEditMode(true);
    setDati({
      id: runner.id,
      username: runner.username || '',
      nome: runner.nome || '',
      cognome: runner.cognome || '',
      email: runner.email || '',
      telefono: runner.telefono || '',
      password: '',
      ruolo: 'runner',
    });
    setIsModalOpen(true);
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

      setSuccesso(`Runner ${isEditMode ? 'aggiornato' : 'creato'} con successo`);
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

  const personeFiltrate = persone.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome && p.nome.toLowerCase().includes(termine)) ||
      (p.cognome && p.cognome.toLowerCase().includes(termine)) ||
      (p.username && p.username.toLowerCase().includes(termine)) ||
      (p.ruolo && p.ruolo.toLowerCase().includes(termine))
    );
  });
  
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

  const { items: personeOrdinate, requestSort, sortConfig } = useSortableData(personeFiltrate);

  const getSortIcon = (nomeColonna) => {
    if (!sortConfig || sortConfig.key !== nomeColonna) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Gestione Runners</h1>
        
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
            + Aggiungi Runner
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titolo={isEditMode ? "Modifica Runner" : "Aggiungi Runner"}>
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
            <label> Password 
              <input name="password" type="password" value={dati.password} onChange={aggiorna} autoComplete="new-password" minLength={8} required={!isEditMode} style={{ width: '100%', marginTop: '0.5rem' }} />
              {isEditMode && <small style={{ color: 'var(--text-muted)' }}>Lascia vuoto per non modificare</small>}
            </label>
          </div>

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
                <th style={{ width: '80px', textAlign: 'center' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {personeOrdinate.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Nessun runner trovato.</td></tr>
              ) : (
                personeOrdinate.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/profile/${p.username}`)}>
                    <td><strong>{p.cognome}</strong></td>
                    <td><strong>{p.nome}</strong></td>
                    <td>{p.username}</td>
                    <td>{p.email || '-'}</td>
                    <td>{p.telefono || '-'}</td>
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