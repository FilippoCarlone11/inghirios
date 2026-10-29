import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import Modal from './Modal'; // <-- Modifica il percorso se necessario
import { useSortableData } from './useSortableData'; // <-- Modifica il percorso se necessario

const FORM_VUOTO = {
  id_accompagnatore: '', 
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
  const [isModalOpen, setIsModalOpen] = useState(false); // Gestione popup

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

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setSuccesso('');
    setInInvio(true);
    
    const datiFormattati = {
      ...dati,
      id_accompagnatore: dati.id_accompagnatore ? Number(dati.id_accompagnatore) : null
    };

    try {
      const creato = await api('/profile/aggiungi-accompagnatore', {
        metodo: 'POST',
        corpo: datiFormattati,
      });
      setSuccesso(`Accompagnatore creato: ${creato.nome || datiFormattati.nome}`);
      setDati(FORM_VUOTO);
      caricaDati();
      
      // Chiude il modale in automatico dopo 1.5 secondi
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

  // Logica di filtraggio
  const accompagnatoriFiltrati = accompagnatori.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome_accompagnatore && p.nome_accompagnatore.toLowerCase().includes(termine)) ||
      (p.cognome_accompagnatore && p.cognome_accompagnatore.toLowerCase().includes(termine)) ||
      (p.nome_persona && p.nome_persona.toLowerCase().includes(termine)) ||
      (p.cognome_persona && p.cognome_persona.toLowerCase().includes(termine))
    );
  });

  // Logica di ordinamento
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
              setIsModalOpen(true);
            }} 
            style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
          >
            + Aggiungi Accompagnatore
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titolo="Crea Nuovo Accompagnatore">
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <label> Associa a una persona (opzionale/richiesto)
            <select name="id_accompagnatore" value={dati.id_accompagnatore} onChange={aggiorna} required style={{ width: '100%', marginTop: '0.5rem' }}>
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
              {inInvio ? 'Creazione in corso...' : 'Crea accompagnatore'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('cognome_accompagnatore')} style={{ cursor: 'pointer' }}>
                  Cognome{getSortIcon('cognome_accompagnatore')}
                </th>
                <th onClick={() => requestSort('nome_accompagnatore')} style={{ cursor: 'pointer' }}>
                  Nome{getSortIcon('nome_accompagnatore')}
                </th>
                <th onClick={() => requestSort('cognome_persona')} style={{ cursor: 'pointer' }}>
                  Ospite di (Persona associata){getSortIcon('cognome_persona')}
                </th>
              </tr>
            </thead>
            <tbody>
              {accompagnatoriOrdinati.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nessun accompagnatore trovato.
                  </td>
                </tr>
              ) : (
                accompagnatoriOrdinati.map((p) => (
                  <tr 
                    key={p.id_persona}
                    onClick={() => navigate(`/profile/${p.id_persona}`)}
                    style={{ cursor: 'pointer' }}
                    title="Clicca per visualizzare il profilo"
                  >
                    <td><strong>{p.cognome_accompagnatore}</strong></td>
                    <td><strong>{p.nome_accompagnatore}</strong></td>
                    <td>{p.nome_persona} {p.cognome_persona}</td>
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