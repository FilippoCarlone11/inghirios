import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import Modal from './Modal';
import { useSortableData } from './useSortableData';

const FORM_LEADER = {
  username: '',
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  password: '',
  ruolo: 'ospite',
};

const FORM_MEMBRO = {
  nome: '',
  cognome: '',
};

export default function GestioneOspiti() {
  const navigate = useNavigate();
  
  // STATI DEL FORM
  const [datiLeader, setDatiLeader] = useState(FORM_LEADER);
  const [membri, setMembri] = useState([]); 
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // STATI DELL'ELENCO
  const [ospiti, setOspiti] = useState([]);
  const [ricerca, setRicerca] = useState('');
  const [espansi, setEspansi] = useState({});

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
    setMembri([...membri, { ...FORM_MEMBRO }]);
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
      const payload = {
        leader: datiLeader,
        membri: membri
      };

      await api('/profile/aggiungi-ospite-gruppo', {
        metodo: 'POST',
        corpo: payload,
      });
      
      setSuccesso(`Ospite/Gruppo creato con successo!`);
      setDatiLeader(FORM_LEADER);
      setMembri([]);
      caricaOspiti();

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

  // GESTIONE TABELLA, RICERCA E ORDINAMENTO
  const toggleEspandi = (id, evento) => {
    evento.stopPropagation();
    setEspansi((prec) => ({ ...prec, [id]: !prec[id] }));
  };

  const ospitiFiltrati = ospiti.filter((o) => {
    const termine = ricerca.toLowerCase();
    
    const matchLeader = 
      (o.nome && o.nome.toLowerCase().includes(termine)) ||
      (o.cognome && o.cognome.toLowerCase().includes(termine)) ||
      (o.username && o.username.toLowerCase().includes(termine));

    const matchMembri = o.membri && o.membri.some((m) => 
      (m.nome && m.nome.toLowerCase().includes(termine)) ||
      (m.cognome && m.cognome.toLowerCase().includes(termine))
    );

    return matchLeader || matchMembri;
  });

  const { items: ospitiOrdinati, requestSort, sortConfig } = useSortableData(ospitiFiltrati);

  const getSortIcon = (nomeColonna) => {
    if (!sortConfig || sortConfig.key !== nomeColonna) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Gestione Ospiti e Gruppi</h1>
        
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
              setIsModalOpen(true);
            }} 
            style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}
          >
            + Aggiungi Ospite / Gruppo
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} titolo="Aggiungi Ospite / Gruppo">
        <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            Dati Ospite Principale (Account)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <label> Nome <input name="nome" value={datiLeader.nome} onChange={aggiornaLeader} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Cognome <input name="cognome" value={datiLeader.cognome} onChange={aggiornaLeader} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Email <input name="email" type="email" value={datiLeader.email} onChange={aggiornaLeader} style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Telefono <input name="telefono" type="tel" value={datiLeader.telefono} onChange={aggiornaLeader} style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Username <input name="username" value={datiLeader.username} onChange={aggiornaLeader} autoComplete="off" required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
            <label> Password <input name="password" type="password" value={datiLeader.password} onChange={aggiornaLeader} autoComplete="new-password" minLength={8} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>Membri del Gruppo (Senza account)</h3>
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
                <label> Nome <input name="nome" value={membro.nome} onChange={(e) => aggiornaMembro(index, e)} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
                <label> Cognome <input name="cognome" value={membro.cognome} onChange={(e) => aggiornaMembro(index, e)} required style={{ width: '100%', marginTop: '0.5rem' }} /></label>
              </div>
            </div>
          ))}

          {errore && <p style={{ color: '#ef4444', marginTop: '1.5rem', marginBottom: 0 }} role="alert">{errore}</p>}
          {successo && <p style={{ color: '#10b981', marginTop: '1.5rem', marginBottom: 0 }} role="status">{successo}</p>}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={inInvio} style={{ minWidth: '150px' }}>
              {inInvio ? 'Salvataggio...' : 'Salva Ospite / Gruppo'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th> 
                <th onClick={() => requestSort('cognome')} style={{ cursor: 'pointer' }}>Cognome{getSortIcon('cognome')}</th>
                <th onClick={() => requestSort('nome')} style={{ cursor: 'pointer' }}>Nome{getSortIcon('nome')}</th>
                <th onClick={() => requestSort('username')} style={{ cursor: 'pointer' }}>Username{getSortIcon('username')}</th>
                <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>Email{getSortIcon('email')}</th>
                <th onClick={() => requestSort('telefono')} style={{ cursor: 'pointer' }}>Telefono{getSortIcon('telefono')}</th>
              </tr>
            </thead>
            <tbody>
              {ospitiOrdinati.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    Nessun ospite trovato.
                  </td>
                </tr>
              ) : (
                ospitiOrdinati.map((leader) => {
                  const haMembri = leader.membri && leader.membri.length > 0;
                  const isEspanso = espansi[leader.id];

                  return (
                    <React.Fragment key={leader.id}>
                      <tr 
                        onClick={() => navigate(`/profile/${leader.id}`)}
                        style={{ cursor: 'pointer', background: haMembri ? 'var(--bg-highlight, #f8fafc)' : 'transparent' }}
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
                        <td><strong>{leader.cognome}</strong> {haMembri && <span style={{fontSize:'0.8rem', color:'var(--text-muted, #64748b)'}}>({leader.membri.length} membri)</span>}</td>
                        <td><strong>{leader.nome}</strong></td>
                        <td>{leader.username}</td>
                        <td>{leader.email || '-'}</td>
                        <td>{leader.telefono || '-'}</td>
                      </tr>

                      {isEspanso && leader.membri.map((membro) => (
                        <tr 
                          key={membro.id || Math.random()}
                          style={{ backgroundColor: 'var(--bg-subrow, #f1f5f9)' }}
                        >
                          <td style={{ textAlign: 'center' }}>↳</td>
                          <td style={{ paddingLeft: '2rem' }}>{membro.cognome}</td>
                          <td>{membro.nome}</td>
                          <td style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</td>
                          <td style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</td>
                          <td style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</td>
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