import { useState, useEffect } from 'react';
import { api } from '../../api.js';
import AlloggioDettaglio from './alloggio-dettaglio.jsx';

export default function GestioneAlloggi() {
  const [vista, setVista] = useState('lista');
  const [alloggi, setAlloggi] = useState([]);
  const [persone, setPersone] = useState([]);
  const [accompagnatori, setAccompagnatori] = useState([]);
  
  // 1. Aggiunto lo stato per i membri del gruppo ospiti
  const [membriOspiti, setMembriOspiti] = useState([]); 
  
  const [caricamento, setCaricamento] = useState(true);
  
  const [formAlloggio, setFormAlloggio] = useState({ nome: '', indirizzo: '' });
  const [alloggioSelezionato, setAlloggioSelezionato] = useState(null);
  const [camere, setCamere] = useState([]);
  const [occupazioni, setOccupazioni] = useState([]);

  useEffect(() => { caricaDatiIniziali(); }, []);

  async function caricaDatiIniziali() {
    setCaricamento(true);
    try {
      // 2. Fetch anche dei membri_ospiti
      const [resAlloggi, resPersone, resAccompagnatori, resMembri] = await Promise.all([
        api('/alloggi/elenco-alloggi'), 
        api('/profile/elenco-persone'), 
        api('/profile/elenco-accompagnatori'),
        api('/profile/elenco-membri-ospiti')
      ]);
      setAlloggi(resAlloggi); 
      setPersone(resPersone); 
      setAccompagnatori(resAccompagnatori);
      setMembriOspiti(resMembri); // Salvataggio nello stato
    } catch (err) {
      alert('Errore nel caricamento: ' + err.message);
    } finally {
      setCaricamento(false);
    }
  }

  async function apriDettaglio(alloggio) {
    setAlloggioSelezionato(alloggio); setCamere([]); setOccupazioni([]); setVista('dettaglio');
    try {
      const [resCamere, resOccupazioni] = await Promise.all([
        api(`/alloggi/elenco-camere/${alloggio.id}`), api(`/alloggi/elenco-occupazioni/${alloggio.id}`)
      ]);
      setCamere(resCamere); setOccupazioni(resOccupazioni);
    } catch (err) { alert("Errore nel caricamento dell'alloggio: " + err.message); }
  }

  async function salvaAlloggio(e) {
    e.preventDefault();
    try {
      const nuovo = await api('/alloggi/aggiungi-alloggio', { metodo: 'POST', corpo: formAlloggio });
      setAlloggi([...alloggi, nuovo]); setFormAlloggio({ nome: '', indirizzo: '' });
    } catch (err) { alert(err.message); }
  }

  async function modificaAlloggio(id, dati) {
    try {
      await api(`/alloggi/modifica-alloggio/${id}`, { metodo: 'PUT', corpo: dati });
      setAlloggi(lista => lista.map(a => a.id === id ? { ...a, ...dati } : a));
      setAlloggioSelezionato(a => (a && a.id === id ? { ...a, ...dati } : a));
      return true;
    } catch (err) { alert(err.message); return false; }
  }

  async function eliminaAlloggio(id) {
    try {
      await api(`/alloggi/elimina-alloggio/${id}`, { metodo: 'DELETE' });
      setAlloggi(lista => lista.filter(a => a.id !== id));
      if (alloggioSelezionato?.id === id) setVista('lista');
    } catch (err) { alert(err.message); }
  }

  async function salvaCamera(dati) {
    try {
      const nuova = await api('/alloggi/aggiungi-camera', { metodo: 'POST', corpo: { ...dati, id_alloggio: alloggioSelezionato.id } });
      setCamere([...camere, nuova]); return true;
    } catch (err) { alert(err.message); return false; }
  }

  async function modificaCamera(id, dati) {
    try {
      await api(`/alloggi/modifica-camera/${id}`, { metodo: 'PUT', corpo: dati });
      setCamere(lista => lista.map(c => c.id === id ? { ...c, ...dati } : c)); return true;
    } catch (err) { alert(err.message); return false; }
  }

  async function rimuoviCamera(id) {
    if (!window.confirm('Eliminare la camera?')) return;
    try {
      await api(`/alloggi/elimina-camera/${id}`, { metodo: 'DELETE' });
      setCamere(lista => lista.filter(c => c.id !== id));
    } catch (err) { alert(err.message); }
  }

  async function salvaOccupazioneDallaCard(id_camera, datiForm) {
    try {
      await api('/alloggi/aggiungi-occupazione', { metodo: 'POST', corpo: { id_camera, ...datiForm } });
      const aggiornate = await api(`/alloggi/elenco-occupazioni/${alloggioSelezionato.id}`);
      setOccupazioni(aggiornate); return true;
    } catch (err) { alert(err.message); return false; }
  }

  async function rimuoviSoggiorno(id_camera, soggiorno) {
    if (!window.confirm(`Rimuovere il soggiorno?`)) return;
    try {
      await api('/alloggi/elimina-soggiorno', { 
        metodo: 'DELETE', 
        corpo: { 
          id_camera, 
          id_persona: soggiorno.id_persona, 
          id_accompagnatore: soggiorno.id_accompagnatore, 
          id_membro_ospite: soggiorno.id_membro_ospite, 
          data_inizio: soggiorno.inizio, 
          data_fine: soggiorno.fine 
        } 
      });
      setOccupazioni(await api(`/alloggi/elenco-occupazioni/${alloggioSelezionato.id}`));
    } catch (err) { alert(err.message); }
  }

  async function rimuoviSingolaNotte(id_occupazione) {
    if (!window.confirm('Rimuovere notte?')) return;
    try {
      await api(`/alloggi/elimina-occupazione/${id_occupazione}`, { metodo: 'DELETE' });
      setOccupazioni(await api(`/alloggi/elenco-occupazioni/${alloggioSelezionato.id}`));
    } catch (err) { alert(err.message); }
  }

  async function aggiornaRimborso(id_occupazione, da_rimborsare) {
    try {
      await api(`/alloggi/aggiorna-rimborso-notte/${id_occupazione}`, { metodo: 'PATCH', corpo: { da_rimborsare } });
      setOccupazioni(lista => lista.map(o => o.id === id_occupazione ? { ...o, da_rimborsare } : o));
    } catch (err) { alert(err.message); }
  }

  if (vista === 'dettaglio') {
    return (
      <AlloggioDettaglio
        alloggio={alloggioSelezionato} camere={camere} occupazioni={occupazioni}
        persone={persone} accompagnatori={accompagnatori}
        
        // 3. PROP AGGIUNTA: Passaggio dei membri ospiti al componente figlio!
        membriOspiti={membriOspiti} 
        
        onChiudi={() => setVista('lista')} onModificaAlloggio={modificaAlloggio} onEliminaAlloggio={eliminaAlloggio}
        onSalvaCamera={salvaCamera} onModificaCamera={modificaCamera} onRimuoviCamera={rimuoviCamera}
        onSalvaOccupazione={salvaOccupazioneDallaCard} onRimuoviSoggiorno={rimuoviSoggiorno} 
        onRimuoviNotte={rimuoviSingolaNotte} onAggiornaRimborso={aggiornaRimborso}
      />
    );
  }

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Gestione B&B e alloggi</h1>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '1', minWidth: '300px' }}>
          <h2>Aggiungi alloggio</h2>
          <form onSubmit={salvaAlloggio} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'block' }}>Nome<input type="text" value={formAlloggio.nome} onChange={(e) => setFormAlloggio({ ...formAlloggio, nome: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} /></label>
            <label style={{ display: 'block' }}>Indirizzo<input type="text" value={formAlloggio.indirizzo} onChange={(e) => setFormAlloggio({ ...formAlloggio, indirizzo: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} /></label>
            <button type="submit" style={{ marginTop: '1rem' }}>Salva alloggio</button>
          </form>
        </div>
        <div style={{ flex: '2', minWidth: '400px' }}>
          <h2>I tuoi alloggi</h2>
          {caricamento ? <p>Caricamento...</p> : alloggi.length === 0 ? <p>Nessun alloggio registrato.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {alloggi.map(a => (
                <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <h3 style={{ margin: 0 }}>{a.nome}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>{a.indirizzo}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button style={{ flex: '1 1 auto', padding: '0.4rem 0.5rem', fontSize: '0.9rem' }} onClick={() => apriDettaglio(a)}>Apri camere</button>
                    <button className="btn-secondary" style={{ flex: '1 1 auto', padding: '0.4rem 0.5rem', fontSize: '0.9rem' }} onClick={() => {
                        const n = window.prompt("Modifica nome:", a.nome);
                        if (n !== null) { 
                          const ind = window.prompt("Modifica indirizzo:", a.indirizzo);
                          if (n && ind) modificaAlloggio(a.id, { nome: n, indirizzo: ind });
                        }
                      }}>Modifica</button>
                    <button style={{ flex: '1 1 auto', padding: '0.4rem 0.5rem', fontSize: '0.9rem', backgroundColor: 'transparent', color: '#b42318', border: '1px solid #b42318', cursor: 'pointer', borderRadius: '4px' }} onClick={() => {
                        if(window.confirm('Eliminare questo B&B?')) eliminaAlloggio(a.id);
                      }}>Elimina</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}