import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  // Stati del form
  const [dati, setDati] = useState(FORM_VUOTO);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  
  // Stati dell'elenco
  const [giurati, setGiurati] = useState([]);
  const [ricerca, setRicerca] = useState('');

  // Funzione per caricare i giurati (separata per poterla richiamare dopo la creazione)
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
      caricaGiurati(); // Aggiorna l'elenco dopo averne creato uno nuovo
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  // Filtro per la ricerca
  const giuratiFiltrati = giurati.filter((p) => {
    const termine = ricerca.toLowerCase();
    return (
      (p.nome && p.nome.toLowerCase().includes(termine)) ||
      (p.cognome && p.cognome.toLowerCase().includes(termine)) ||
      (p.username && p.username.toLowerCase().includes(termine))
    );
  });

  return (
    <>
      {/* SEZIONE 1: CREAZIONE GIURATO */}
      <h1 style={{ marginBottom: '2rem' }}>Aggiungi Giurato</h1>
      
      <div className="card" style={{  marginBottom: '4rem' }}>
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* DATI PERSONALI */}
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

          {/* DETTAGLI GIURIA */}
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            Dettagli Giuria
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <label> Tipologia Giudice
              <select name="tipo_giudice" value={dati.tipo_giudice} onChange={aggiorna} required>
                <option value="">Seleziona...</option>
                <option value="critica">Critica (Tecnico)</option>
                <option value="internazionale">Internazionale (Popolare)</option>
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

          {errore && <p style={{ color: '#ef4444', marginTop: '1.5rem' }} role="alert">{errore}</p>}
          {successo && <p style={{ color: '#10b981', marginTop: '1.5rem' }} role="status">{successo}</p>}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={inInvio} style={{ minWidth: '150px' }}>
              {inInvio ? 'Creazione in corso...' : 'Crea Giurato'}
            </button>
          </div>
        </form>
      </div>


      {/* SEZIONE 2: ELENCO E RICERCA GIURATI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Gestione Giurati</h1>
        
        {/* Campo di ricerca */}
        <input 
          type="text" 
          placeholder="Cerca per nome, cognome o username..." 
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
                <th>Username</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Tipo Giuria</th>
                <th>Partecipazione</th>
                <th>Emittente</th>
                <th>Mezzo di Info</th>
                <th style={{ textAlign: 'center' }}>Liberatoria</th>
                <th style={{ textAlign: 'center' }}>In Edizione</th>
              </tr>
            </thead>
            <tbody>
              {giuratiFiltrati.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nessun giurato trovato.
                  </td>
                </tr>
              ) : (
                giuratiFiltrati.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => navigate(`/profile/${p.id}`)}
                    style={{ cursor: 'pointer' }}
                    title="Clicca per visualizzare il profilo"
                  >
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