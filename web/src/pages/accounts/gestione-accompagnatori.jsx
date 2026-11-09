import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import Modal from './Modal';
import { useSortableData } from './useSortableData';

const FORM_VUOTO = {
  id: '',
  id_persona: '', 
  nome: '',
  cognome: ''
};

export default function GestioneAccompagnatori() {
  const navigate = useNavigate();

  const [dati, setDati] = useState(FORM_VUOTO);
  const [persone, setPersone] = useState([]); 
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  const [accompagnatori, setAccompagnatori] = useState([]);
  
  const [ricerca, setRicerca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  function caricaDati() {
    api('/profile/elenco-persone')
      .then(setPersone)
      .catch((err) => setErrore(err.message));

    api('/profile/elenco-accompagnatori')
      .then(setAccompagnatori)
      .catch((err) => setErrore(err.message));
  }

  useEffect(() => {
    caricaDati();
  }, []);

  function aggiorna(evento) {
    const { name, value } = evento.target;
    setDati((precedenti) => ({ ...precedenti, [name]: value }));
  }

  function apriModalModifica(accompagnatore, evento) {
    evento.stopPropagation();
    setErrore('');
    setSuccesso('');
    setIsEditMode(true);
    setDati({
      id: accompagnatore.id,
      id_persona: accompagnatore.id_persona || '',
      nome: accompagnatore.nome_accompagnatore || '',
      cognome: accompagnatore.cognome_accompagnatore || ''
    });
    setIsModalOpen(true);
  }

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setSuccesso('');
    setInInvio(true);
    
    const datiFormattati = {
      nome: dati.nome,
      cognome: dati.cognome,
      id_persona: dati.id_persona ? Number(dati.id_persona) : null
    };

    try {
      let endpoint = '/profile/aggiungi-accompagnatore';
      let metodo = 'POST';

      if (isEditMode) {
        endpoint = `/profile/modifica-accompagnatore/${dati.id}`;
        metodo = 'PUT';
      }

      await api(endpoint, {
        metodo: metodo,
        corpo: datiFormattati,
      });

      setSuccesso(`Accompagnatore ${isEditMode ? 'aggiornato' : 'creato'}`);
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

  const accompagnatoriFiltrati = accompagnatori.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome_accompagnatore && p.nome_accompagnatore.toLowerCase().includes(termine)) ||
      (p.cognome_accompagnatore && p.cognome_accompagnatore.toLowerCase().includes(termine)) ||
      (p.nome_persona && p.nome_persona.toLowerCase().includes(termine)) ||
      (p.cognome_persona && p.cognome_persona.toLowerCase().includes(termine))
    );
  });

  async function elimina(id, evento) {
    evento.stopPropagation();
    if (!window.confirm('Sei sicuro di voler eliminare questo elemento? Questa azione non può essere annullata.')) {
      return;
    }
    try {
      await api(`/profile/elimina-accompagnatore/${id}`, { metodo: 'DELETE' });
      caricaDati();
    } catch (err) {
      setErrore(`Errore durante l'eliminazione: ${err.message}`);
    }
  }

  const { items: accompagnatoriOrdinati, requestSort, sortConfig } = useSortableData(accompagnatoriFiltrati);

  const getSortIcon = (nomeColonna) => {
    if (!sortConfig || sortConfig.key !== nomeColonna) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Gestione Accompagnatori</h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Cerca nome o cognome..." 
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            style={{ padding: '0.5rem', width: '100%', minWidth: '250px', borderRadius: '4px', border: '1px solid var(--border)' }}
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
            + Aggiungi Accompagnatore
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titolo={isEditMode ? "Modifica Accompagnatore" : "Crea Nuovo Accompagnatore"}>
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <label> Associa a una persona (opzionale/richiesto)
            <select name="id_persona" value={dati.id_persona} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }}>
              <option value="">Scegli persona...</option>
              {persone.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome} {r.cognome}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label> Nome
              <input name="nome" value={dati.nome} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }} />
            </label>
            <label> Cognome
              <input name="cognome" value={dati.cognome} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }} />
            </label>
          </div>

          {errore && <p role="alert" style={{ color: '#ef4444', margin: 0 }}>{errore}</p>}
          {successo && <p role="status" style={{ color: '#10b981', margin: 0 }}>{successo}</p>}

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={inInvio}>
              {inInvio ? 'Salvataggio in corso...' : (isEditMode ? 'Salva modifiche' : 'Crea accompagnatore')}
            </button>
          </div>
        </form>
      </Modal>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('cognome_accompagnatore')} style={{ cursor: 'pointer' }}>Cognome{getSortIcon('cognome_accompagnatore')}</th>
                <th onClick={() => requestSort('nome_accompagnatore')} style={{ cursor: 'pointer' }}>Nome{getSortIcon('nome_accompagnatore')}</th>
                <th onClick={() => requestSort('cognome_persona')} style={{ cursor: 'pointer' }}>Ospite di{getSortIcon('cognome_persona')}</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {accompagnatoriOrdinati.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Nessun accompagnatore trovato.</td></tr>
              ) : (
                accompagnatoriOrdinati.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.cognome_accompagnatore}</strong></td>
                    <td><strong>{p.nome_accompagnatore}</strong></td>
                    <td>{p.nome_persona} {p.cognome_persona}</td>
                    <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={(e) => apriModalModifica(p, e)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}>✎</button>
                      <button onClick={(e) => elimina(p.id, e)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', padding: '0.3rem 0.6rem' }}>✕</button>
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