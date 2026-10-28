import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

const FORM_VUOTO = {
  username: '',
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  password: '',
  ruolo: 'ospite',
};

export default function GestioneOspiti() {
  const navigate = useNavigate();
  
  // STATI DEL FORM
  const [datiLeader, setDatiLeader] = useState({ ...FORM_VUOTO, capo_gruppo: true });
  const [membri, setMembri] = useState([]); // Array dinamico per i membri del gruppo
  
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  
  // STATI DELL'ELENCO
  const [ospiti, setOspiti] = useState([]);
  const [ricerca, setRicerca] = useState('');
  const [espansi, setEspansi] = useState({}); // Tiene traccia di quali gruppi sono aperti nella tabella

  // Caricamento dati
  function caricaOspiti() {
    api('/profile/elenco-ospiti')
      .then(setOspiti)
      .catch((err) => setErrore(err.message));
  }

  useEffect(() => {
    caricaOspiti();
  }, []);

  // GESTIONE FORM
  function aggiornaLeader(evento) {
    const { name, value } = evento.target;
    setDatiLeader((prec) => ({ ...prec, [name]: value }));
  }

  function aggiungiMembro() {
    setMembri([...membri, { ...FORM_VUOTO, capo_gruppo: false }]);
  }

  function rimuoviMembro(index) {
    setMembri(membri.filter((_, i) => i !== index));
  }

  function aggiornaMembro(index, evento) {
    const { name, value } = evento.target;
    const nuoviMembri = [...membri];
    nuoviMembri[index][name] = value;
    setMembri(nuoviMembri);
  }

  async function invia(evento) {
    evento.preventDefault();
    setErrore('');
    setSuccesso('');
    setInInvio(true);
    
    try {
      // Invia il leader e i membri in un'unica chiamata (il backend dovrà estrarli)
      const payload = {
        leader: datiLeader,
        membri: membri
      };

      // N.B: Assicurati che l'API backend gestisca questa struttura!
      const creato = await api('/profile/aggiungi-ospite-gruppo', {
        metodo: 'POST',
        corpo: payload,
      });
      
      setSuccesso(`Ospite/Gruppo creato con successo!`);
      setDatiLeader({ ...FORM_VUOTO, capo_gruppo: true });
      setMembri([]);
      caricaOspiti();
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInInvio(false);
    }
  }

  // GESTIONE TABELLA E RICERCA
  const toggleEspandi = (id, evento) => {
    evento.stopPropagation(); // Evita che il click sulla freccia apra anche il profilo
    setEspansi((prec) => ({ ...prec, [id]: !prec[id] }));
  };

  // 1. Filtriamo in base alla ricerca (Cerca sia nei leader che nei membri)
  const termine = ricerca.toLowerCase();
  const ospitiFiltrati = ospiti.filter((p) => 
    (p.nome && p.nome.toLowerCase().includes(termine)) ||
    (p.cognome && p.cognome.toLowerCase().includes(termine)) ||
    (p.username && p.username.toLowerCase().includes(termine))
  );

  // 2. Separiamo i leader (o ospiti singoli) dai membri subordinati
  // Un ospite è leader se non ha un id_capogruppo
  const leaderList = ospitiFiltrati.filter((o) => !o.id_capogruppo);

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Aggiungi Ospite / Gruppo</h1>
      
      <div className="card" style={{ marginBottom: '4rem' }}>
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* SEZIONE LEADER */}
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            Dati Ospite Principale (Capo Gruppo)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <label> Nome <input name="nome" value={datiLeader.nome} onChange={aggiornaLeader} required /></label>
            <label> Cognome <input name="cognome" value={datiLeader.cognome} onChange={aggiornaLeader} required /></label>
            <label> Email <input name="email" type="email" value={datiLeader.email} onChange={aggiornaLeader} /></label>
            <label> Telefono <input name="telefono" type="tel" value={datiLeader.telefono} onChange={aggiornaLeader} /></label>
            <label> Username <input name="username" value={datiLeader.username} onChange={aggiornaLeader} autoComplete="off" required /></label>
            <label> Password <input name="password" type="password" value={datiLeader.password} onChange={aggiornaLeader} autoComplete="new-password" minLength={8} required /></label>
          </div>

          {/* SEZIONE MEMBRI AGGIUNTIVI */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>Membri del Gruppo (Opzionale)</h3>
            <button type="button" onClick={aggiungiMembro} style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}>
              + Aggiungi Membro
            </button>
          </div>

          {membri.map((membro, index) => (
            <div key={index} style={{ padding: '1rem', border: '1px dashed var(--border)', borderRadius: '8px', marginBottom: '1.5rem', position: 'relative' }}>
              <button 
                type="button" 
                onClick={() => rimuoviMembro(index)} 
                style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
              >
                Rimuovi
              </button>
              <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Membro #{index + 1}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label> Nome <input name="nome" value={membro.nome} onChange={(e) => aggiornaMembro(index, e)} required /></label>
                <label> Cognome <input name="cognome" value={membro.cognome} onChange={(e) => aggiornaMembro(index, e)} required /></label>
                <label> Email <input name="email" type="email" value={membro.email} onChange={(e) => aggiornaMembro(index, e)} /></label>
                <label> Telefono <input name="telefono" type="tel" value={membro.telefono} onChange={(e) => aggiornaMembro(index, e)} /></label>
                <label> Username <input name="username" value={membro.username} onChange={(e) => aggiornaMembro(index, e)} autoComplete="off" required /></label>
                <label> Password <input name="password" type="password" value={membro.password} onChange={(e) => aggiornaMembro(index, e)} autoComplete="new-password" minLength={8} required /></label>
              </div>
            </div>
          ))}

          {errore && <p style={{ color: '#ef4444', marginTop: '1.5rem' }} role="alert">{errore}</p>}
          {successo && <p style={{ color: '#10b981', marginTop: '1.5rem' }} role="status">{successo}</p>}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={inInvio} style={{ minWidth: '150px' }}>
              {inInvio ? 'Creazione in corso...' : 'Salva Ospite / Gruppo'}
            </button>
          </div>
        </form>
      </div>

      {/* SEZIONE 2: ELENCO E RICERCA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Gestione Ospiti e Gruppi</h1>
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
                <th style={{ width: '40px' }}></th> {/* Colonna per la freccina di espansione */}
                <th>Cognome</th>
                <th>Nome</th>
                <th>Username</th>
                <th>Email</th>
                <th>Telefono</th>
              </tr>
            </thead>
            <tbody>
              {leaderList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nessun ospite trovato.
                  </td>
                </tr>
              ) : (
                leaderList.map((leader) => {
                  // Cerco se questo leader ha membri associati (cercando nell'array originale, non in quello filtrato)
                  const membriDelGruppo = ospiti.filter(o => o.id_capogruppo === leader.id);
                  const haMembri = membriDelGruppo.length > 0;
                  const isEspanso = espansi[leader.id];

                  return (
                    <React.Fragment key={leader.id}>
                      {/* RIGA LEADER */}
                      <tr 
                        onClick={() => navigate(`/profile/${leader.id}`)}
                        style={{ cursor: 'pointer', background: haMembri ? '#f8fafc' : 'transparent' }}
                        title="Clicca per visualizzare il profilo"
                      >
                        <td style={{ textAlign: 'center' }}>
                          {haMembri && (
                            <button 
                              onClick={(e) => toggleEspandi(leader.id, e)}
                              style={{ padding: '0.2rem 0.5rem', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '1.2rem', color: 'var(--primary)' }}
                            >
                              {isEspanso ? '▼' : '▶'}
                            </button>
                          )}
                        </td>
                        <td><strong>{leader.cognome}</strong> {haMembri && <span style={{fontSize:'0.8rem', color:'#64748b'}}>(Gruppo)</span>}</td>
                        <td><strong>{leader.nome}</strong></td>
                        <td>{leader.username}</td>
                        <td>{leader.email || '-'}</td>
                        <td>{leader.telefono || '-'}</td>
                      </tr>

                      {/* RIGHE MEMBRI (visibili solo se espanso) */}
                      {isEspanso && membriDelGruppo.map((membro) => (
                        <tr 
                          key={membro.id}
                          onClick={() => navigate(`/profile/${membro.id}`)}
                          style={{ cursor: 'pointer', backgroundColor: '#f1f5f9' }}
                        >
                          <td style={{ textAlign: 'center' }}>↳</td>
                          <td style={{ paddingLeft: '2rem' }}>{membro.cognome}</td>
                          <td>{membro.nome}</td>
                          <td>{membro.username}</td>
                          <td>{membro.email || '-'}</td>
                          <td>{membro.telefono || '-'}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}