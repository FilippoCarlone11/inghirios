import { useEffect, useState } from 'react';
import { api } from '../../api.js';

// 1. Aggiunti i campi mancanti (cognome e id_accompagnatore)
const FORM_VUOTO = {
  id_accompagnatore: '', 
  nome: '',
  cognome: ''
};

export default function CreaAccompagnatore() {
  const [dati, setDati] = useState(FORM_VUOTO);
  const [persone, setPersone] = useState([]); // 2. Modificato in array vuoto []
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);

  useEffect(() => {
    // Presumo che questa rotta restituisca la lista delle persone nel DB
    api('/profile/elenco-persone')
      .then(setPersone)
      .catch((err) => setErrore(err.message));
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
    
    // Convertiamo l'ID in numero prima di inviare, se necessario per il DB
    const datiFormattati = {
      ...dati,
      id_accompagnatore: dati.id_accompagnatore ? Number(dati.id_accompagnatore) : null
    };

    try {
      const creato = await api('/profile/aggiungi-accompagnatore', {
        metodo: 'POST',
        corpo: datiFormattati,
      });
      setSuccesso(`Accompagnatore creato: ${creato.nome}`);
      setDati(FORM_VUOTO);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Crea Nuovo Accompagnatore</h1>
      
      <div className="card" style={{ maxWidth: '700px' }}>
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <label> Associa a una persona (opzionale/richiesto)
            {/* 3. Cambiato name in "id_accompagnatore" per coincidere col DB */}
            <select name="id_accompagnatore" value={dati.id_accompagnatore} onChange={aggiorna} required>
              <option value="">Scegli persona...</option>
              {/* 4. Gestito r come oggetto (r.id, r.nome) */}
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
    </>
  );
}