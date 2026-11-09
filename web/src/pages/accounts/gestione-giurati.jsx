import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  tipo_giudice: '',
  tipo_partecipazione: '',
  emittente: '',
  mezzo_di_informazione: '',
};

export default function GestioneGiurati() {
  const navigate = useNavigate();
  
  const [dati, setDati] = useState(FORM_VUOTO);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  
  const [giurati, setGiurati] = useState([]);
  const [ricerca, setRicerca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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

  function apriModalModifica(giurato, evento) {
    evento.stopPropagation();
    setErrore('');
    setSuccesso('');
    setIsEditMode(true);
    setDati({
      id: giurato.id,
      username: giurato.username || '',
      nome: giurato.nome || '',
      cognome: giurato.cognome || '',
      email: giurato.email || '',
      telefono: giurato.telefono || '',
      password: '',
      tipo_giudice: giurato.tipo_giuria || '',
      tipo_partecipazione: giurato.partecipazione || '',
      emittente: giurato.emittente || '',
      mezzo_di_informazione: giurato.mezzo_di_informazione || '',
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
      let endpoint = '/profile/aggiungi-giurato';
      let metodo = 'POST';

      if (isEditMode) {
        endpoint = `/profile/modifica-giurato/${dati.id}`;
        metodo = 'PUT';
      }

      await api(endpoint, {
        metodo: metodo,
        corpo: payload,
      });

      setSuccesso(`Giurato ${isEditMode ? 'aggiornato' : 'creato'} con successo`);
      setDati(FORM_VUOTO);
      caricaGiurati(); 
      
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

  const giuratiFiltrati = giurati.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome && p.nome.toLowerCase().includes(termine)) ||
      (p.cognome && p.cognome.toLowerCase().includes(termine)) ||
      (p.username && p.username.toLowerCase().includes(termine))
    );
  });

  async function elimina(id, evento) {
    evento.stopPropagation();
    if (!window.confirm('Sei sicuro di voler eliminare questo elemento? Questa azione non può essere annullata.')) {
      return;
    }
    try {
      await api(`/profile/${id}`, { metodo: 'DELETE' });
      caricaGiurati();
    } catch (err) {
      setErrore(`Errore durante l'eliminazione: ${err.message}`);
    }
  }

  const { items: giuratiOrdinati, requestSort, sortConfig } = useSortableData(giuratiFiltrati);

  const getSortIcon = (nomeColonna) => {
    if (!sortConfig || sortConfig.key !== nomeColonna) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
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
              setIsEditMode(false);
              setDati(FORM_VUOTO);
              setIsModalOpen(true);
            }} 
            style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
          >
            + Aggiungi Giurato
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titolo={isEditMode ? "Modifica Giurato" : "Aggiungi Nuovo Giurato"}>
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
            <label> Password 
              <input name="password" type="password" value={dati.password} onChange={aggiorna} autoComplete="new-password" minLength={8} required={!isEditMode} style={{ width: '100%', marginTop: '0.5rem' }} />
              {isEditMode && <small style={{ color: 'var(--text-muted)' }}>Lascia vuoto per non modificare</small>}
            </label>
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
              {inInvio ? 'Salvataggio...' : (isEditMode ? 'Salva Modifiche' : 'Crea Giurato')}
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
                <th onClick={() => requestSort('tipo_giuria')} style={{ cursor: 'pointer' }}>Tipo Giuria{getSortIcon('tipo_giuria')}</th>
                <th onClick={() => requestSort('partecipazione')} style={{ cursor: 'pointer' }}>Partecipazione{getSortIcon('partecipazione')}</th>
                <th onClick={() => requestSort('emittente')} style={{ cursor: 'pointer' }}>Emittente{getSortIcon('emittente')}</th>
                <th onClick={() => requestSort('mezzo_di_informazione')} style={{ cursor: 'pointer' }}>Mezzo di Info{getSortIcon('mezzo_di_informazione')}</th>
                <th onClick={() => requestSort('liberatoria_consegnata')} style={{ cursor: 'pointer', textAlign: 'center' }}>Liberatoria{getSortIcon('liberatoria_consegnata')}</th>
                <th onClick={() => requestSort('partecipa_in_questa_edizione')} style={{ cursor: 'pointer', textAlign: 'center' }}>In Edizione{getSortIcon('partecipa_in_questa_edizione')}</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {giuratiOrdinati.length === 0 ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '2rem' }}>Nessun giurato trovato.</td></tr>
              ) : (
                giuratiOrdinati.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/profile/${p.username}`)} style={{ cursor: 'pointer' }} title="Clicca per visualizzare il profilo">
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
                    <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => apriModalModifica(p, e)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }}>✎</button>
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