import { useState, useEffect } from 'react';
import { api } from '../../api.js';

// ==========================================
// COMPONENTE FIGLIO: LA SINGOLA CAMERA
// ==========================================
function CameraCard({ camera, occupazioni, persone, onAssegna }) {
  const [form, setForm] = useState({
    id_persona: '', data_inizio: '', data_fine: '', orario_checkin: '', orario_checkout: ''
  });

  const onSubmit = (e) => {
    e.preventDefault();
    onAssegna(camera.id, form);
    setForm({ id_persona: '', data_inizio: '', data_fine: '', orario_checkin: '', orario_checkout: '' });
  };

  const personeInCamera = occupazioni.filter(occ => occ.id_camera === camera.id);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' }}>
      
      {/* Header Camera */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Camera #{camera.id}</h3>
        <span style={{ fontWeight: '500' }}>{camera.posti_letto} Letti | €{Number(camera.costo_per_notte).toFixed(2)}/notte</span>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Persone attuali */}
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Ospiti Assegnati</h4>
        {personeInCamera.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>Nessuna assegnazione.</p>
        ) : (
          <ul style={{ margin: '0 0 1.5rem 0', paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
            {personeInCamera.map(occ => (
              <li key={occ.id} style={{ marginBottom: '0.5rem' }}>
                <strong>{occ.nome_persona} {occ.cognome_persona}</strong> 
                <br/>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {new Date(occ.data).toLocaleDateString('it-IT')} 
                  {occ.orario_checkin && ` (In: ${occ.orario_checkin})`}
                  {occ.orario_checkout && ` (Out: ${occ.orario_checkout})`}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Form Assegnazione */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Nuova Assegnazione</h5>
          
          <label> Persona (Ospite):
            <select 
              value={form.id_persona} 
              onChange={(e) => setForm({ ...form, id_persona: e.target.value })} 
              required>
              <option value="">-- Seleziona --</option>
              {persone.map(p => <option key={p.id} value={p.id}>{p.nome} {p.cognome}</option>)}
            </select>
          </label>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ flex: 1 }}> Check-in (Da):
              <input type="date" value={form.data_inizio} onChange={(e) => setForm({ ...form, data_inizio: e.target.value })} required />
            </label>
            
            <label style={{ flex: 1 }}> Check-out (A):
              <input type="date" value={form.data_fine} min={form.data_inizio} onChange={(e) => setForm({ ...form, data_fine: e.target.value })} required />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ flex: 1 }}> Orario In (Opz.):
              <input type="time" value={form.orario_checkin} onChange={(e) => setForm({ ...form, orario_checkin: e.target.value })} />
            </label>
            <label style={{ flex: 1 }}> Orario Out (Opz.):
              <input type="time" value={form.orario_checkout} onChange={(e) => setForm({ ...form, orario_checkout: e.target.value })} />
            </label>
          </div>

          <button type="submit" style={{ marginTop: '1rem' }}>
            Aggiungi Ospite
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPALE (LISTA ALLOGGI)
// ==========================================
export default function GestioneAlloggi() {
  const [vista, setVista] = useState('lista'); 
  const [alloggi, setAlloggi] = useState([]);
  const [persone, setPersone] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  const [formAlloggio, setFormAlloggio] = useState({ nome: '', indirizzo: '', orario_checkin_standard: '14:00', orario_checkout_standard: '10:00' });
  const [alloggioSelezionato, setAlloggioSelezionato] = useState(null);
  const [camere, setCamere] = useState([]);
  const [occupazioni, setOccupazioni] = useState([]);
  const [formCamera, setFormCamera] = useState({ posti_letto: '', costo_per_notte: '' });

  useEffect(() => {
    caricaDatiIniziali();
  }, []);

  async function caricaDatiIniziali() {
    setCaricamento(true);
    try {
      const [resAlloggi, resPersone] = await Promise.all([
        api('/alloggi/elenco-alloggi'),
        api('/profile/elenco-persone')
      ]);
      setAlloggi(resAlloggi);
      setPersone(resPersone);
    } catch (err) {
      alert("Errore nel caricamento: " + err.message);
    } finally {
      setCaricamento(false);
    }
  }

  async function salvaAlloggio(e) {
    e.preventDefault();
    try {
      const nuovoAlloggio = await api('/alloggi/aggiungi-alloggio', {
        metodo: 'POST', corpo: formAlloggio
      });
      setAlloggi([...alloggi, nuovoAlloggio]);
      setFormAlloggio({ nome: '', indirizzo: '', orario_checkin_standard: '14:00', orario_checkout_standard: '10:00' });
    } catch (err) {
      alert(err.message);
    }
  }

  async function apriDettaglio(alloggio) {
    setAlloggioSelezionato(alloggio);
    setVista('dettaglio');
    try {
      const [resCamere, resOccupazioni] = await Promise.all([
        api(`/alloggi/elenco-camere/${alloggio.id}`),
        api(`/alloggi/elenco-occupazioni/${alloggio.id}`)
      ]);
      setCamere(resCamere);
      setOccupazioni(resOccupazioni);
    } catch (err) {
      alert("ERRORE DI CARICAMENTO ALLOGGI: " + err.message);
      console.error(err);
    }
  }

  function chiudiDettaglio() {
    setAlloggioSelezionato(null);
    setVista('lista');
  }

  async function salvaCamera(e) {
    e.preventDefault();
    try {
      const nuovaCamera = await api('/alloggi/aggiungi-camera', {
        metodo: 'POST',
        corpo: {
          id_alloggio: alloggioSelezionato.id,
          posti_letto: Number(formCamera.posti_letto),
          costo_per_notte: Number(formCamera.costo_per_notte)
        }
      });
      setCamere([...camere, nuovaCamera]);
      setFormCamera({ posti_letto: '', costo_per_notte: '' });
    } catch (err) {
      alert(err.message);
    }
  }

  async function salvaOccupazioneDallaCard(id_camera, datiForm) {
    try {
      const nuoveOccupazioniGenerate = await api('/alloggi/aggiungi-occupazione', {
        metodo: 'POST',
        corpo: {
          id_camera: id_camera,
          id_persona: Number(datiForm.id_persona),
          data_inizio: datiForm.data_inizio,
          data_fine: datiForm.data_fine,
          orario_checkin: datiForm.orario_checkin,
          orario_checkout: datiForm.orario_checkout
        }
      });
      setOccupazioni([...occupazioni, ...nuoveOccupazioniGenerate]);
    } catch (err) {
      alert("Errore salvataggio ospite: " + err.message);
    }
  }

  if (vista === 'lista') {
    return (
      <>
        <h1 style={{ marginBottom: '2rem' }}>Gestione B&B e Alloggi</h1>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          <div className="card" style={{ flex: '1', minWidth: '300px' }}>
            <h2>Aggiungi Alloggio</h2>
            <form onSubmit={salvaAlloggio} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Nome (es. B&B La Terrazza)
                <input type="text" value={formAlloggio.nome} onChange={(e) => setFormAlloggio({...formAlloggio, nome: e.target.value})} required />
              </label>
              <label>Indirizzo
                <input type="text" value={formAlloggio.indirizzo} onChange={(e) => setFormAlloggio({...formAlloggio, indirizzo: e.target.value})} required />
              </label>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ flex: 1 }}>Check-in standard
                  <input type="time" value={formAlloggio.orario_checkin_standard} onChange={(e) => setFormAlloggio({...formAlloggio, orario_checkin_standard: e.target.value})} required />
                </label>
                <label style={{ flex: 1 }}>Check-out standard
                  <input type="time" value={formAlloggio.orario_checkout_standard} onChange={(e) => setFormAlloggio({...formAlloggio, orario_checkout_standard: e.target.value})} required />
                </label>
              </div>

              <button type="submit" style={{ marginTop: '1rem' }}>Salva Alloggio</button>
            </form>
          </div>

          <div className="card" style={{ flex: '2', minWidth: '400px' }}>
            <h2>Elenco Alloggi</h2>
            {caricamento ? <p style={{ color: 'var(--text-muted)' }}>Caricamento...</p> : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>Nome</th><th>Indirizzo</th><th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alloggi.map(a => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td><strong>{a.nome}</strong></td>
                        <td>{a.indirizzo}</td>
                        <td>
                          <button className="btn-secondary" onClick={() => apriDettaglio(a)}>Gestisci Camere</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // VISTA DETTAGLIO ALLOGGIO
  return (
    <>
      <button className="btn-secondary" onClick={chiudiDettaglio} style={{ marginBottom: '1.5rem' }}>← Torna agli Alloggi</button>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Gestione Camere: {alloggioSelezionato.nome}</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>📍 {alloggioSelezionato.indirizzo}</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        <div className="card" style={{ flex: '1', minWidth: '300px' }}>
          <h2>Aggiungi Camera</h2>
          <form onSubmit={salvaCamera} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Posti Letto
              <input type="number" min="1" value={formCamera.posti_letto} onChange={(e) => setFormCamera({...formCamera, posti_letto: e.target.value})} required />
            </label>
            <label>Costo per Notte (€)
              <input type="number" step="0.01" min="0" value={formCamera.costo_per_notte} onChange={(e) => setFormCamera({...formCamera, costo_per_notte: e.target.value})} required />
            </label>
            <button type="submit" style={{ marginTop: '1rem' }}>Aggiungi Camera</button>
          </form>
        </div>

        <div style={{ flex: '2', minWidth: '400px' }}>
          <h2>Camere Disponibili</h2>
          {camere.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nessuna camera registrata per questo alloggio.</p>
          ) : (
            <div>
              {camere.map(camera => (
                <CameraCard 
                  key={camera.id} 
                  camera={camera} 
                  occupazioni={occupazioni} 
                  persone={persone} 
                  onAssegna={salvaOccupazioneDallaCard} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}