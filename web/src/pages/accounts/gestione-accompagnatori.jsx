import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

const FORM_VUOTO = {
  id_accompagnatore: '', 
  nome: '',
  cognome: ''
};

export default function GestioneAccompagnatori() {
  const navigate = useNavigate(); // 1. Inizializzato navigate

  const [dati, setDati] = useState(FORM_VUOTO);
  const [persone, setPersone] = useState([]); 
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  const [accompagnatori, setAccompagnatori] = useState([]);
  
  const [ricerca, setRicerca] = useState(''); // 2. Aggiunto stato per la ricerca

  // Funzione per caricare i dati separata per poterla riutilizzare
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
      caricaDati(); // Ricarica la lista dopo la creazione
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  // 3. Logica di filtraggio in base alla ricerca
  const accompagnatoriFiltrati = accompagnatori.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome_accompagnatore && p.nome_accompagnatore.toLowerCase().includes(termine)) ||
      (p.cognome_accompagnatore && p.cognome_accompagnatore.toLowerCase().includes(termine)) ||
      (p.nome_persona && p.nome_persona.toLowerCase().includes(termine)) ||
      (p.cognome_persona && p.cognome_persona.toLowerCase().includes(termine))
    );
  });

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Crea Nuovo Accompagnatore</h1>
      
      <div className="card" style={{ marginBottom: '4rem' }}>
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <label> Associa a una persona (opzionale/richiesto)
            <select name="id_accompagnatore" value={dati.id_accompagnatore} onChange={aggiorna} required>
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
              <input name="nome" value={dati.nome} onChange={aggiorna} required />
            </label>
            <label> Cognome
              <input name="cognome" value={dati.cognome} onChange={aggiorna} required />
            </label>
          </div>

          {errore && <p role="alert" style={{ color: '#ef4444', margin: '0.5rem 0' }}>{errore}</p>}
          {successo && <p role="status" style={{ color: '#10b981', margin: '0.5rem 0' }}>{successo}</p>}

          <div style={{ marginTop: '1.5rem' }}>
            <button type="submit" disabled={inInvio}>
              {inInvio ? 'Creazione...' : 'Crea accompagnatore'}
            </button>
          </div>
        </form>
      </div>

      {/* SEZIONE 2: ELENCO E RICERCA ACCOMPAGNATORI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Gestione Accompagnatori</h1>
        
        {/* Campo di ricerca */}
        <input 
          type="text" 
          placeholder="Cerca per nome o cognome..." 
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          style={{ padding: '0.5rem', width: '100%', maxWidth: '300px', borderRadius: '4px', border: '1px solid var(--border)' }}
        />
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Cognome</th>
                <th>Nome</th>
                <th>Ospite di (Persona associata)</th>
              </tr>
            </thead>
            <tbody>
              {/* 4. Uso l'array filtrato invece di quello completo */}
              {accompagnatoriFiltrati.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nessun accompagnatore trovato.
                  </td>
                </tr>
              ) : (
                accompagnatoriFiltrati.map((p) => (
                  <tr 
                    key={p.id_persona} // Fallback per la key se id manca
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