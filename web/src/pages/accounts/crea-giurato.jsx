import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

const FORM_VUOTO = {
  username: '',
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  password: '',
  // Campi specifici per il giurato
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

  // Un'unica funzione per tutti i campi: usa il "name" dell'input
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
      // Assicurati che l'URL combaci con la rotta del tuo backend
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
    <main>
      <p>
        <Link to="/">← Indietro</Link>
      </p>
      <h1>Crea Giurato</h1>
      
      <form onSubmit={invia}>
        <fieldset>
          <legend>Dati Personali</legend>
          <label>
            Username
            <input name="username" value={dati.username} onChange={aggiorna} autoComplete="off" required />
          </label>
          <label>
            Nome
            <input name="nome" value={dati.nome} onChange={aggiorna} required />
          </label>
          <label>
            Cognome
            <input name="cognome" value={dati.cognome} onChange={aggiorna} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={dati.email} onChange={aggiorna} />
          </label>
          <label>
            Telefono
            <input name="telefono" type="tel" value={dati.telefono} onChange={aggiorna} />
          </label>
          <label>
            Password
            <input name="password" type="password" value={dati.password} onChange={aggiorna} autoComplete="new-password" minLength={8} required />
          </label>
        </fieldset>

        <fieldset>
          <legend>Dati Giurato</legend>
          <label>
            Tipologia Giudice
            <select name="tipo_giudice" value={dati.tipo_giudice} onChange={aggiorna} required>
              <option value="">Seleziona...</option>
              <option value="critica">Tecnico</option>
              <option value="internazionale">Popolare</option>
              <option value="tecnica">Tecnica</option>
            </select>
          </label>
          
          <label>
            Tipologia Partecipazione
            <select name="tipo_partecipazione" value={dati.tipo_partecipazione} onChange={aggiorna} required>
              <option value="">Seleziona...</option>
            
              <option value="in loco">In loco</option>
              <option value="da remoto">Da remoto</option>
            </select>
          </label>
          
          <label>
            Emittente
            <input name="emittente" value={dati.emittente} onChange={aggiorna} />
          </label>
          
          <label>
            Mezzo di informazione
            <input name="mezzo_di_informazione" value={dati.mezzo_di_informazione} onChange={aggiorna} />
          </label>
        </fieldset>

        {errore && <p style={{color: 'red'}} role="alert">{errore}</p>}
        {successo && <p style={{color: 'green'}} role="status">{successo}</p>}

        <button type="submit" disabled={inInvio}>
          {inInvio ? 'Creazione in corso...' : 'Crea Giurato'}
        </button>
      </form>
    </main>
  );
}