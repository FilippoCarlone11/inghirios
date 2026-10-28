import { useState, useEffect } from 'react';
import { api } from '../../api.js';

// ==========================================
// FUNZIONI DI SUPPORTO
// ==========================================
const euro = (n) => `€${Number(n || 0).toFixed(2)}`;

// Converte qualunque data in "YYYY-MM-DD" usando il fuso locale
// (evita lo slittamento di un giorno quando il server restituisce date UTC)
function aISO(valore) {
  const d = new Date(valore);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formattaData(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function giorniTra(isoA, isoB) {
  return (Date.parse(isoB) - Date.parse(isoA)) / 86400000;
}

// Il backend salva una riga per ogni giorno di occupazione.
// Qui le uniamo in "soggiorni" (un intervallo continuo per persona)
// e agganciamo i rimborsi che appartengono a quel soggiorno.
function costruisciSoggiorni(idCamera, occupazioni, rimborsi) {
  const righe = occupazioni.filter((o) => o.id_camera === idCamera);

  const perPersona = {};
  righe.forEach((r) => {
    if (!perPersona[r.id_persona]) perPersona[r.id_persona] = [];
    perPersona[r.id_persona].push(r);
  });

  const soggiorni = [];
  Object.values(perPersona).forEach((lista) => {
    const ordinate = [...lista].sort((a, b) => aISO(a.data).localeCompare(aISO(b.data)));
    let corrente = null;
    ordinate.forEach((r) => {
      const giorno = aISO(r.data);
      if (corrente && giorniTra(corrente.fine, giorno) <= 1) {
        corrente.fine = giorno;
      } else {
        corrente = {
          id_persona: r.id_persona,
          nome: `${r.nome_persona} ${r.cognome_persona}`,
          inizio: giorno,
          fine: giorno,
          rimborsi: []
        };
        soggiorni.push(corrente);
      }
    });
  });

  soggiorni.forEach((s) => {
    s.rimborsi = rimborsi.filter((r) => {
      if (r.id_camera !== idCamera || r.id_persona !== s.id_persona) return false;
      const inizio = aISO(r.data_inizio);
      return inizio >= s.inizio && inizio <= s.fine;
    });
    s.totaleRimborsi = s.rimborsi.reduce((somma, r) => somma + Number(r.importo), 0);
  });

  return soggiorni.sort((a, b) => a.inizio.localeCompare(b.inizio));
}

const stilePericolo = { backgroundColor: 'transparent', color: '#b42318', border: '1px solid #b42318' };
const stileBottonePiccolo = { padding: '0.35rem 0.75rem', fontSize: '0.9rem' };

// ==========================================
// FORM MODIFICA ALLOGGIO (usato in lista e in dettaglio)
// ==========================================
function ModificaAlloggio({ alloggio, onSalva, onAnnulla }) {
  const [form, setForm] = useState({ nome: alloggio.nome, indirizzo: alloggio.indirizzo });

  const onSubmit = async (e) => {
    e.preventDefault();
    await onSalva(form);
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label>Nome
        <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
      </label>
      <label>Indirizzo
        <input type="text" value={form.indirizzo} onChange={(e) => setForm({ ...form, indirizzo: e.target.value })} required />
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="submit">Salva modifiche</button>
        <button type="button" className="btn-secondary" onClick={onAnnulla}>Annulla</button>
      </div>
    </form>
  );
}

// ==========================================
// CARD DI UN ALLOGGIO NELLA LISTA
// ==========================================
function AlloggioCard({ alloggio, onApri, onModifica }) {
  const [inModifica, setInModifica] = useState(false);

  if (inModifica) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Modifica alloggio</h3>
        <ModificaAlloggio
          alloggio={alloggio}
          onAnnulla={() => setInModifica(false)}
          onSalva={async (dati) => {
            const ok = await onModifica(alloggio.id, dati);
            if (ok) setInModifica(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <h3 style={{ margin: 0 }}>{alloggio.nome}</h3>
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>{alloggio.indirizzo}</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button onClick={() => onApri(alloggio)}>Apri camere</button>
        <button className="btn-secondary" onClick={() => setInModifica(true)}>Modifica</button>
      </div>
    </div>
  );
}

// ==========================================
// CARD DELLA SINGOLA CAMERA
// ==========================================
function CameraCard({ camera, occupazioni, rimborsi, persone, onAssegna, onModifica, onRimuovi }) {
  const formVuoto = { id_persona: '', data_inizio: '', data_fine: '', rimborsi: [] };
  const [form, setForm] = useState(formVuoto);
  const [formAperto, setFormAperto] = useState(false);
  const [inModifica, setInModifica] = useState(false);
  const [formCamera, setFormCamera] = useState({
    posti_letto: camera.posti_letto,
    costo_per_notte: camera.costo_per_notte
  });

  const soggiorni = costruisciSoggiorni(camera.id, occupazioni, rimborsi);
  const totaleCamera = soggiorni.reduce((somma, s) => somma + s.totaleRimborsi, 0);
  const intervalloScelto = form.data_inizio && form.data_fine;

  // --- rimborsi nel form ---
  const aggiungiRimborso = () =>
    setForm({ ...form, rimborsi: [...form.rimborsi, { descrizione: '', importo: '' }] });

  const aggiornaRimborso = (indice, campo, valore) =>
    setForm({
      ...form,
      rimborsi: form.rimborsi.map((r, i) => (i === indice ? { ...r, [campo]: valore } : r))
    });

  const rimuoviRimborso = (indice) =>
    setForm({ ...form, rimborsi: form.rimborsi.filter((_, i) => i !== indice) });

  // --- invio assegnazione ---
  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await onAssegna(camera.id, form);
    if (ok) {
      setForm(formVuoto);
      setFormAperto(false);
    }
  };

  // --- invio modifica camera ---
  const onSubmitCamera = async (e) => {
    e.preventDefault();
    const ok = await onModifica(camera.id, formCamera);
    if (ok) setInModifica(false);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' }}>

      {/* Intestazione camera */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Camera #{camera.id}</h3>
          <span style={{ fontWeight: '500' }}>
            {camera.posti_letto} posti letto, {euro(camera.costo_per_notte)} a notte
          </span>
        </div>
        {!inModifica && (
          <button className="btn-secondary" style={stileBottonePiccolo} onClick={() => setInModifica(true)}>
            Modifica camera
          </button>
        )}
      </div>

      <div style={{ padding: '1.5rem' }}>

        {/* Modifica camera */}
        {inModifica && (
          <form onSubmit={onSubmitCamera} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Modifica camera</h5>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ flex: 1 }}>Posti letto
                <input type="number" min="1" value={formCamera.posti_letto} onChange={(e) => setFormCamera({ ...formCamera, posti_letto: e.target.value })} required />
              </label>
              <label style={{ flex: 1 }}>Costo a notte (€)
                <input type="number" step="0.01" min="0" value={formCamera.costo_per_notte} onChange={(e) => setFormCamera({ ...formCamera, costo_per_notte: e.target.value })} required />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit">Salva modifiche</button>
              <button type="button" className="btn-secondary" onClick={() => setInModifica(false)}>Annulla</button>
            </div>
          </form>
        )}

        {/* Soggiorni */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Ospiti assegnati</h4>
          {totaleCamera > 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Rimborsi da ricevere: <strong>{euro(totaleCamera)}</strong>
            </span>
          )}
        </div>

        {soggiorni.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
            Nessun ospite in questa camera.
          </p>
        ) : (
          <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            {soggiorni.map((s, i) => (
              <div key={`${s.id_persona}-${s.inizio}`} style={{ padding: '0.75rem 1rem', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <strong>{s.nome}</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      dal {formattaData(s.inizio)} al {formattaData(s.fine)}
                    </div>
                  </div>
                  <button style={{ ...stilePericolo, ...stileBottonePiccolo }} onClick={() => onRimuovi(camera.id, s)}>
                    Rimuovi
                  </button>
                </div>

                {s.rimborsi.length > 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                    {s.rimborsi.map((r) => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{r.descrizione}</span>
                        <span>{euro(r.importo)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', marginTop: '0.35rem', paddingTop: '0.35rem', fontWeight: 600 }}>
                      <span>Da restituire</span>
                      <span>{euro(s.totaleRimborsi)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Aggiungi ospite */}
        {!formAperto ? (
          <button className="btn-secondary" onClick={() => setFormAperto(true)}>Aggiungi ospite</button>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Nuova assegnazione</h5>

            <label>Ospite
              <select value={form.id_persona} onChange={(e) => setForm({ ...form, id_persona: e.target.value })} required>
                <option value="">Seleziona una persona</option>
                {persone.map((p) => <option key={p.id} value={p.id}>{p.nome} {p.cognome}</option>)}
              </select>
            </label>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ flex: 1 }}>Dal giorno
                <input type="date" value={form.data_inizio} onChange={(e) => setForm({ ...form, data_inizio: e.target.value })} required />
              </label>
              <label style={{ flex: 1 }}>Al giorno
                <input type="date" value={form.data_fine} min={form.data_inizio} onChange={(e) => setForm({ ...form, data_fine: e.target.value })} required />
              </label>
            </div>

            {/* I rimborsi compaiono quando è stato scelto un intervallo di date */}
            {intervalloScelto && (
              <div style={{ marginTop: '0.5rem' }}>
                <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Rimborsi da richiedere all'ospite</h5>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Per il periodo dal {formattaData(form.data_inizio)} al {formattaData(form.data_fine)}.
                </p>

                {form.rimborsi.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                    <label style={{ flex: 2 }}>Motivo
                      <input type="text" value={r.descrizione} onChange={(e) => aggiornaRimborso(i, 'descrizione', e.target.value)} placeholder="es. Tassa di soggiorno" required />
                    </label>
                    <label style={{ flex: 1 }}>Importo (€)
                      <input type="number" step="0.01" min="0.01" value={r.importo} onChange={(e) => aggiornaRimborso(i, 'importo', e.target.value)} required />
                    </label>
                    <button type="button" style={{ ...stilePericolo, ...stileBottonePiccolo }} onClick={() => rimuoviRimborso(i)}>
                      Togli
                    </button>
                  </div>
                ))}

                <button type="button" className="btn-secondary" style={stileBottonePiccolo} onClick={aggiungiRimborso}>
                  Aggiungi rimborso
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit">Salva assegnazione</button>
              <button type="button" className="btn-secondary" onClick={() => { setForm(formVuoto); setFormAperto(false); }}>Annulla</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPALE
// ==========================================
export default function GestioneAlloggi() {
  const [vista, setVista] = useState('lista');
  const [alloggi, setAlloggi] = useState([]);
  const [persone, setPersone] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  const [formAlloggio, setFormAlloggio] = useState({ nome: '', indirizzo: '' });
  const [alloggioSelezionato, setAlloggioSelezionato] = useState(null);
  const [modificaIntestazione, setModificaIntestazione] = useState(false);
  const [camere, setCamere] = useState([]);
  const [occupazioni, setOccupazioni] = useState([]);
  const [rimborsi, setRimborsi] = useState([]);
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
      alert('Errore nel caricamento: ' + err.message);
    } finally {
      setCaricamento(false);
    }
  }

  async function caricaDettaglio(idAlloggio) {
    try {
      const [resCamere, resOccupazioni, resRimborsi] = await Promise.all([
        api(`/alloggi/elenco-camere/${idAlloggio}`),
        api(`/alloggi/elenco-occupazioni/${idAlloggio}`),
        api(`/alloggi/elenco-rimborsi/${idAlloggio}`)
      ]);
      setCamere(resCamere);
      setOccupazioni(resOccupazioni);
      setRimborsi(resRimborsi);
    } catch (err) {
      alert("Errore nel caricamento dell'alloggio: " + err.message);
      console.error(err);
    }
  }

  async function salvaAlloggio(e) {
    e.preventDefault();
    try {
      const nuovoAlloggio = await api('/alloggi/aggiungi-alloggio', {
        metodo: 'POST', corpo: formAlloggio
      });
      setAlloggi([...alloggi, nuovoAlloggio]);
      setFormAlloggio({ nome: '', indirizzo: '' });
    } catch (err) {
      alert(err.message);
    }
  }

  // Restituisce true se la modifica è andata a buon fine
  async function modificaAlloggio(id, dati) {
    try {
      await api(`/alloggi/modifica-alloggio/${id}`, { metodo: 'PUT', corpo: dati });
      setAlloggi((lista) => lista.map((a) => (a.id === id ? { ...a, ...dati } : a)));
      setAlloggioSelezionato((a) => (a && a.id === id ? { ...a, ...dati } : a));
      return true;
    } catch (err) {
      alert('Errore nella modifica: ' + err.message);
      return false;
    }
  }

  async function apriDettaglio(alloggio) {
    setAlloggioSelezionato(alloggio);
    setModificaIntestazione(false);
    setCamere([]);
    setOccupazioni([]);
    setRimborsi([]);
    setVista('dettaglio');
    await caricaDettaglio(alloggio.id);
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

  async function modificaCamera(id, dati) {
    const corpo = {
      posti_letto: Number(dati.posti_letto),
      costo_per_notte: Number(dati.costo_per_notte)
    };
    try {
      await api(`/alloggi/modifica-camera/${id}`, { metodo: 'PUT', corpo });
      setCamere((lista) => lista.map((c) => (c.id === id ? { ...c, ...corpo } : c)));
      return true;
    } catch (err) {
      alert('Errore nella modifica della camera: ' + err.message);
      return false;
    }
  }

  async function salvaOccupazioneDallaCard(id_camera, datiForm) {
    try {
      await api('/alloggi/aggiungi-occupazione', {
        metodo: 'POST',
        corpo: {
          id_camera,
          id_persona: Number(datiForm.id_persona),
          data_inizio: datiForm.data_inizio,
          data_fine: datiForm.data_fine,
          rimborsi: datiForm.rimborsi.map((r) => ({
            descrizione: r.descrizione.trim(),
            importo: Number(r.importo)
          }))
        }
      });
      await caricaDettaglio(alloggioSelezionato.id);
      return true;
    } catch (err) {
      alert('Errore salvataggio ospite: ' + err.message);
      return false;
    }
  }

  async function rimuoviSoggiorno(id_camera, soggiorno) {
    if (!window.confirm(`Rimuovere ${soggiorno.nome} dal ${formattaData(soggiorno.inizio)} al ${formattaData(soggiorno.fine)}? Verranno cancellati anche i suoi rimborsi.`)) return;
    try {
      await api('/alloggi/elimina-soggiorno', {
        metodo: 'DELETE',
        corpo: {
          id_camera,
          id_persona: soggiorno.id_persona,
          data_inizio: soggiorno.inizio,
          data_fine: soggiorno.fine
        }
      });
      await caricaDettaglio(alloggioSelezionato.id);
    } catch (err) {
      alert('Errore nella rimozione: ' + err.message);
    }
  }

  // ---------- VISTA LISTA ----------
  if (vista === 'lista') {
    return (
      <>
        <h1 style={{ marginBottom: '2rem' }}>Gestione B&B e alloggi</h1>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          <div className="card" style={{ flex: '1', minWidth: '300px' }}>
            <h2>Aggiungi alloggio</h2>
            <form onSubmit={salvaAlloggio} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Nome (es. B&B La Terrazza)
                <input type="text" value={formAlloggio.nome} onChange={(e) => setFormAlloggio({ ...formAlloggio, nome: e.target.value })} required />
              </label>
              <label>Indirizzo
                <input type="text" value={formAlloggio.indirizzo} onChange={(e) => setFormAlloggio({ ...formAlloggio, indirizzo: e.target.value })} required />
              </label>
              <button type="submit" style={{ marginTop: '1rem' }}>Salva alloggio</button>
            </form>
          </div>

          <div style={{ flex: '2', minWidth: '400px' }}>
            <h2>I tuoi alloggi</h2>
            {caricamento ? (
              <p style={{ color: 'var(--text-muted)' }}>Caricamento...</p>
            ) : alloggi.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nessun alloggio registrato. Aggiungine uno dal modulo a fianco.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {alloggi.map((a) => (
                  <AlloggioCard key={a.id} alloggio={a} onApri={apriDettaglio} onModifica={modificaAlloggio} />
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ---------- VISTA DETTAGLIO ----------
  const postiTotali = camere.reduce((somma, c) => somma + Number(c.posti_letto), 0);
  const ospitiTotali = new Set(occupazioni.map((o) => o.id_persona)).size;
  const rimborsiTotali = rimborsi.reduce((somma, r) => somma + Number(r.importo), 0);

  const riepilogo = [
    { etichetta: 'Camere', valore: camere.length },
    { etichetta: 'Posti letto', valore: postiTotali },
    { etichetta: 'Ospiti', valore: ospitiTotali },
    { etichetta: 'Rimborsi da ricevere', valore: euro(rimborsiTotali) }
  ];

  return (
    <>
      <button className="btn-secondary" onClick={chiudiDettaglio} style={{ marginBottom: '1.5rem' }}>
        ← Torna agli alloggi
      </button>

      <div className="card" style={{ marginBottom: '2rem' }}>
        {modificaIntestazione ? (
          <>
            <h2 style={{ marginTop: 0 }}>Modifica alloggio</h2>
            <ModificaAlloggio
              alloggio={alloggioSelezionato}
              onAnnulla={() => setModificaIntestazione(false)}
              onSalva={async (dati) => {
                const ok = await modificaAlloggio(alloggioSelezionato.id, dati);
                if (ok) setModificaIntestazione(false);
              }}
            />
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ marginBottom: '0.5rem' }}>{alloggioSelezionato.nome}</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>{alloggioSelezionato.indirizzo}</p>
            </div>
            <button className="btn-secondary" onClick={() => setModificaIntestazione(true)}>Modifica alloggio</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {riepilogo.map((r) => (
            <div key={r.etichetta}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{r.valore}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{r.etichetta}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <div className="card" style={{ flex: '1', minWidth: '300px' }}>
          <h2>Aggiungi camera</h2>
          <form onSubmit={salvaCamera} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Posti letto
              <input type="number" min="1" value={formCamera.posti_letto} onChange={(e) => setFormCamera({ ...formCamera, posti_letto: e.target.value })} required />
            </label>
            <label>Costo a notte (€)
              <input type="number" step="0.01" min="0" value={formCamera.costo_per_notte} onChange={(e) => setFormCamera({ ...formCamera, costo_per_notte: e.target.value })} required />
            </label>
            <button type="submit" style={{ marginTop: '1rem' }}>Aggiungi camera</button>
          </form>
        </div>

        <div style={{ flex: '2', minWidth: '400px' }}>
          <h2>Camere</h2>
          {camere.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nessuna camera registrata per questo alloggio.</p>
          ) : (
            camere.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                occupazioni={occupazioni}
                rimborsi={rimborsi}
                persone={persone}
                onAssegna={salvaOccupazioneDallaCard}
                onModifica={modificaCamera}
                onRimuovi={rimuoviSoggiorno}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}