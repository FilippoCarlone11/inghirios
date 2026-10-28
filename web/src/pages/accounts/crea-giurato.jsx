import { useState } from 'react';
import { api } from '../../api.js';

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

export default function CreaGiurato() {
  const [dati, setDati] = useState(FORM_VUOTO);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);

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
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Aggiungi Giurato</h1>
      
      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* SEZIONE DATI PERSONALI */}
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            Dati Personali
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <label> Nome
              <input name="nome" value={dati.nome} onChange={aggiorna} required />
            </label>
            <label> Cognome
              <input name="cognome" value={dati.cognome} onChange={aggiorna} required />
            </label>
            <label> Email
              <input name="email" type="email" value={dati.email} onChange={aggiorna} />
            </label>
            <label> Telefono
              <input name="telefono" type="tel" value={dati.telefono} onChange={aggiorna} />
            </label>
            <label> Username
              <input name="username" value={dati.username} onChange={aggiorna} autoComplete="off" required />
            </label>
            <label> Password
              <input name="password" type="password" value={dati.password} onChange={aggiorna} autoComplete="new-password" minLength={8} required />
            </label>
          </div>

          {/* SEZIONE DATI GIURATO */}
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            Dettagli Giuria
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <label> Tipologia Giudice
              <select name="tipo_giudice" value={dati.tipo_giudice} onChange={aggiorna} required>
                <option value="">Seleziona...</option>
                <option value="critica">Tecnico</option>
                <option value="internazionale">Popolare</option>
                <option value="tecnica">Tecnica</option>
              </select>
            </label>
            <label> Tipologia Partecipazione
              <select name="tipo_partecipazione" value={dati.tipo_partecipazione} onChange={aggiorna} required>
                <option value="">Seleziona...</option>
                <option value="in loco">In loco</option>
                <option value="da remoto">Da remoto</option>
              </select>
            </label>
            <label> Emittente
              <input name="emittente" value={dati.emittente} onChange={aggiorna} />
            </label>
            <label> Mezzo di informazione
              <input name="mezzo_di_informazione" value={dati.mezzo_di_informazione} onChange={aggiorna} />
            </label>
          </div>

          {/* MESSAGGI E BOTTONE */}
          {errore && <p style={{ color: '#ef4444', marginTop: '1.5rem' }} role="alert">{errore}</p>}
          {successo && <p style={{ color: '#10b981', marginTop: '1.5rem' }} role="status">{successo}</p>}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={inInvio} style={{ minWidth: '150px' }}>
              {inInvio ? 'Creazione in corso...' : 'Crea Giurato'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}