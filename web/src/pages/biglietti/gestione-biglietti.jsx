import { useState, useEffect } from 'react';
import { api } from '../../api.js';

// ... (Lascia intatti gli array COMPAGNIE e CODICI_LUOGHI come li hai tu, aggiungendo BGY e ARN)
const COMPAGNIE = ['trenitalia', 'ita_airways', 'ryanair', 'easyjet', 'wizz_air', 'volotea', 'lufthansa', 'grimaldi_lines', 'altra_compagnia', 'nessuna'];
const CODICI_LUOGHI = [
  { codice: 'FCO', nome: 'Roma Fiumicino' },
  { codice: 'CAG', nome: 'Cagliari Elmas' },
  { codice: 'MXP', nome: 'Milano Malpensa' },
  { codice: 'BGY', nome: 'Milano Bergamo' },
  { codice: 'ARN', nome: 'Stoccolma Arlanda' }
];
const STATI_BIGLIETTO = ['comprato', 'in_ritardo', 'arrivato', 'cancellato', 'rimborso_richiesto', 'rimborso_ottenuto'];

// Icona per stato (i colori sono in App.css: .stato-comprato, .stato-in_ritardo, ...)
const STATO_ICONA = {
  comprato: '🎟️',
  in_ritardo: '⏱️',
  arrivato: '✅',
  cancellato: '🚫',
  rimborso_richiesto: '📨',
  rimborso_ottenuto: '💶',
};

const FORM_VUOTO = {
  id: '', id_utente: '', codice_prenotazione: '', codice_volo: '', codice_treno: '',
  compagnia: '', stato: 'comprato', costo: '', da_rimborsare_ospite: false,
  partenza: '', arrivo: '', orario_partenza_previsto: '', orario_arrivo_previsto: ''
};

// Normalizza un nome: minuscolo, senza accenti, parole ordinate (funziona anche con nome/cognome invertiti)
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .split(/\s+/).filter(Boolean).sort().join(' ');

const nomeLuogo = (codice) => CODICI_LUOGHI.find((l) => l.codice === codice)?.nome || '';

const fmtData = (iso) => iso
  ? new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  : '';
const fmtOra = (iso) => iso
  ? new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  : '';
const fmtEuro = (n) => (n === null || n === undefined || n === '')
  ? '-'
  : Number(n).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

export default function GestioneBiglietti() {
  const [persone, setPersone] = useState([]);
  const [accompagnatori, setAccompagnatori] = useState([]);
  const [membriOspiti, setMembriOspiti] = useState([]);
  const [biglietti, setBiglietti] = useState([]);

  const [dati, setDati] = useState(FORM_VUOTO);
  const [fileFattura, setFileFattura] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Dati estratti dal PDF
  const [viaggioPdf, setViaggioPdf] = useState({});
  const [passeggeriPdf, setPasseggeriPdf] = useState([]);

  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [inInvio, setInInvio] = useState(false);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    caricaTutto();
  }, []);

  async function caricaTutto() {
    try {
      const [b, p, a, m] = await Promise.all([
        api('/biglietti/elenco-biglietti'),
        api('/profile/elenco-persone'),
        api('/profile/elenco-accompagnatori'),
        api('/profile/elenco-membri-ospiti')
      ]);
      setBiglietti(b); setPersone(p); setAccompagnatori(a); setMembriOspiti(m);
    } catch (err) {
      setErrore('Errore nel caricamento: ' + err.message);
    } finally { setCaricamento(false); }
  }

  function aggiorna(evento) {
    const { name, value, type, checked } = evento.target;
    setDati((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  // Cerca il passeggero del PDF tra persone, accompagnatori e membri ospiti
  function trovaOspite(nomePdf) {
    const target = norm(nomePdf);
    const candidati = [
      ...persone.map((p) => ({ v: `p_${p.id}`, n: `${p.nome} ${p.cognome}` })),
      ...accompagnatori.map((a) => ({ v: `a_${a.id}`, n: `${a.nome_accompagnatore} ${a.cognome_accompagnatore}` })),
      ...membriOspiti.map((m) => ({ v: `m_${m.id}`, n: `${m.nome} ${m.cognome}` })),
    ];
    return candidati.find((c) => norm(c.n) === target)?.v || '';
  }

  function usaPasseggero(p, viaggio = viaggioPdf) {
    setDati((prev) => ({
      ...prev,
      ...viaggio,
      id_utente: trovaOspite(p.nome) || '',
      costo: p.costo ?? prev.costo,
    }));
  }

  async function gestisciUploadFattura(evento) {
    const file = evento.target.files[0];
    setFileFattura(file);
    setViaggioPdf({});
    setPasseggeriPdf([]);

    if (file && file.type === 'application/pdf') {
      const formData = new FormData();
      formData.append('fattura', file);

      try {
        const token = localStorage.getItem('inghirios_token');
        console.log("Inviando il PDF per l'analisi...");

        const response = await fetch(`http://localhost:3000/api/biglietti/analizza-pdf`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (response.ok) {
          const { passeggeri = [], costo_totale, ...viaggio } = await response.json();
          console.log("Dati ricevuti dal backend:", { passeggeri, costo_totale, ...viaggio });

          setViaggioPdf(viaggio);
          setPasseggeriPdf(passeggeri);

          if (passeggeri.length === 1) usaPasseggero(passeggeri[0], viaggio);
          else setDati((prev) => ({ ...prev, ...viaggio }));
        } else {
          console.error("Errore server:", await response.text());
        }
      } catch (err) {
        console.error("Errore di rete durante autocompletamento:", err);
      }
    }
  }

  async function cambiaStatoRapido(id, nuovoStato) {
    try {
      await api(`/biglietti/cambia-stato/${id}`, { metodo: 'PATCH', corpo: { stato: nuovoStato } });
      setBiglietti(lista => lista.map(b => b.id === id ? { ...b, stato: nuovoStato } : b));
    } catch (err) { alert('Errore cambio stato: ' + err.message); }
  }

  function apriModifica(b) {
    window.scrollTo(0, 0);
    setIsEditMode(true);
    let id_selezionato = '';
    if (b.id_utente) id_selezionato = `p_${b.id_utente}`;
    else if (b.id_accompagnatore) id_selezionato = `a_${b.id_accompagnatore}`;
    else if (b.id_membro_ospite) id_selezionato = `m_${b.id_membro_ospite}`;

    setDati({ ...b, id_utente: id_selezionato });
    setFileFattura(null);
    setViaggioPdf({});
    setPasseggeriPdf([]);
  }

  async function invia(evento) {
    evento.preventDefault();
    setErrore(''); setSuccesso(''); setInInvio(true);

    const formData = new FormData();
    Object.keys(dati).forEach(key => {
      if (dati[key] !== null && dati[key] !== undefined) formData.append(key, dati[key]);
    });

    // Per rinominare il file passiamo il nome del passeggero al backend
    const selectEl = document.querySelector('select[name="id_utente"]');
    if (selectEl && selectEl.options[selectEl.selectedIndex]) {
      formData.append('nome_passeggero', selectEl.options[selectEl.selectedIndex].text);
    }

    if (fileFattura) formData.append('fattura', fileFattura);

    try {
      const endpoint = isEditMode ? `/biglietti/modifica-biglietto/${dati.id}` : '/biglietti/aggiungi-biglietto';
      const response = await fetch(`http://localhost:3000/api${endpoint}`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('inghirios_token')}` },
        body: formData
      });

      if (!response.ok) throw new Error(await response.text());

      setSuccesso(isEditMode ? 'Biglietto modificato!' : 'Biglietto creato!');
      // NOTA: fileFattura, viaggioPdf e passeggeriPdf restano di proposito, così puoi
      // cliccare sul passeggero successivo e salvare con la stessa fattura allegata.
      setDati(FORM_VUOTO); setIsEditMode(false);
      caricaTutto(); // Ricarica la lista per sicurezza
    } catch (err) { setErrore(err.message); }
    finally { setInInvio(false); }
  }

  async function eliminaBiglietto(id) {
    if (!window.confirm("Sei sicuro di voler eliminare questo biglietto?")) return;
    try {
      await api(`/biglietti/elimina-biglietto/${id}`, { metodo: 'DELETE' });
      setBiglietti((prev) => prev.filter(b => b.id !== id));
    } catch (err) { alert(err.message); }
  }

  const formattaEnum = (t) => t?.replace(/_/g, ' ').toUpperCase() || '';

  return (
    <>
      <h1 style={{ marginBottom: '2rem' }}>Gestione Biglietti e Viaggi</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card">
          <h2>{isEditMode ? 'Modifica Biglietto' : 'Aggiungi Biglietto'}</h2>
          <form onSubmit={invia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <label> Ospite
                <select name="id_utente" value={dati.id_utente} onChange={aggiorna} required>
                  <option value="">Seleziona...</option>
                  <optgroup label="Utenti Principali">{persone.map(p => <option key={`p_${p.id}`} value={`p_${p.id}`}>{p.nome} {p.cognome}</option>)}</optgroup>
                  <optgroup label="Accompagnatori">{accompagnatori.map(a => <option key={`a_${a.id}`} value={`a_${a.id}`}>{a.nome_accompagnatore} {a.cognome_accompagnatore}</option>)}</optgroup>
                  <optgroup label="Elenco Ospiti">{membriOspiti.map(m => <option key={`m_${m.id}`} value={`m_${m.id}`}>{m.nome} {m.cognome}</option>)}</optgroup>
                </select>
              </label>

              <label> Da (Partenza)
                <select name="partenza" value={dati.partenza} onChange={aggiorna} required>
                  <option value="">Scegli...</option>{CODICI_LUOGHI.map(l => <option key={l.codice} value={l.codice}>{l.codice} - {l.nome}</option>)}
                </select>
              </label>

              <label> A (Arrivo)
                <select name="arrivo" value={dati.arrivo} onChange={aggiorna} required>
                  <option value="">Scegli...</option>{CODICI_LUOGHI.map(l => <option key={l.codice} value={l.codice}>{l.codice} - {l.nome}</option>)}
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <label>Compagnia
                <select name="compagnia" value={dati.compagnia} onChange={aggiorna} required>
                  <option value="">Scegli...</option>{COMPAGNIE.map((c) => <option key={c} value={c}>{formattaEnum(c)}</option>)}
                </select>
              </label>
              <label> Stato
                <select name="stato" value={dati.stato} onChange={aggiorna} required>
                  {STATI_BIGLIETTO.map(s => <option key={s} value={s}>{formattaEnum(s)}</option>)}
                </select>
              </label>
              <label>Costo (€) <input name="costo" type="number" step="0.01" min="0" value={dati.costo} onChange={aggiorna} required /></label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <label>Cod. Prenotazione <input name="codice_prenotazione" type="text" value={dati.codice_prenotazione || ''} onChange={aggiorna} /></label>
              <label>Cod. Volo <input name="codice_volo" type="text" value={dati.codice_volo || ''} onChange={aggiorna} /></label>
              <label>Cod. Treno <input name="codice_treno" type="text" value={dati.codice_treno || ''} onChange={aggiorna} /></label>
            </div>

            <fieldset style={{ margin: '0', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <legend style={{ padding: '0 8px', fontWeight: '600' }}>Orari Previsti & Fattura</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <label>Partenza: <input name="orario_partenza_previsto" type="datetime-local" value={dati.orario_partenza_previsto ? dati.orario_partenza_previsto.slice(0, 16) : ''} onChange={aggiorna} /></label>
                <label>Arrivo: <input name="orario_arrivo_previsto" type="datetime-local" value={dati.orario_arrivo_previsto ? dati.orario_arrivo_previsto.slice(0, 16) : ''} onChange={aggiorna} /></label>
                <label>Carica PDF Fattura <input type="file" accept=".pdf,image/*" onChange={gestisciUploadFattura} /></label>

                {passeggeriPdf.length > 1 && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {passeggeriPdf.map((p) => (
                      <button type="button" key={p.nome} onClick={() => usaPasseggero(p)}>
                        {p.nome}{p.costo != null ? ` — ${p.costo.toFixed(2)} €` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input name="da_rimborsare_ospite" type="checkbox" checked={dati.da_rimborsare_ospite} onChange={aggiorna} style={{ marginTop: 0 }} /> Da rimborsare
            </label>

            {errore && <p role="alert" style={{ color: '#ef4444', margin: 0 }}>{errore}</p>}
            {successo && <p role="status" style={{ color: '#10b981', margin: 0 }}>{successo}</p>}

            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" disabled={inInvio}>{inInvio ? 'Salvataggio...' : (isEditMode ? 'Salva Modifiche' : 'Crea Biglietto')}</button>
              {isEditMode && <button type="button" className="btn-secondary" onClick={() => { setIsEditMode(false); setDati(FORM_VUOTO); }}>Annulla</button>}
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Biglietti Salvati ({biglietti.length})</h2>

          {caricamento ? <p>Caricamento...</p> : biglietti.length === 0 ? (
            <p className="bg-vuoto">Nessun biglietto salvato.</p>
          ) : (
            <div className="table-container">
              <table className="bg-tabella">
                <thead>
                  <tr>
                    <th>Ospite</th>
                    <th>Tratta</th>
                    <th>Compagnia / Codici</th>
                    <th>Costo</th>
                    <th>Stato</th>
                    <th>Fattura</th>
                    <th style={{ textAlign: 'right' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {biglietti.map((b) => (
                    <tr key={b.id}>
                      {/* OSPITE */}
                      <td>
                        <div className="bg-ospite">{b.nome} {b.cognome}</div>
                        <div className="bg-sub">
                          {b.id_utente ? 'Utente principale' : b.id_accompagnatore ? 'Accompagnatore' : b.id_membro_ospite ? 'Elenco ospiti' : ''}
                        </div>
                      </td>

                      {/* TRATTA: aeroporti, orari di partenza e arrivo, data */}
                      <td>
                        <div className="bg-tratta">
                          <div>
                            <div className="bg-iata">{b.partenza}</div>
                            <div className="bg-sub">{nomeLuogo(b.partenza)}</div>
                            <div className="bg-sub"><strong>{fmtOra(b.orario_partenza_previsto) || '--:--'}</strong></div>
                          </div>
                          <span className="bg-freccia">→</span>
                          <div>
                            <div className="bg-iata">{b.arrivo}</div>
                            <div className="bg-sub">{nomeLuogo(b.arrivo)}</div>
                            <div className="bg-sub"><strong>{fmtOra(b.orario_arrivo_previsto) || '--:--'}</strong></div>
                          </div>
                        </div>
                        {b.orario_partenza_previsto && (
                          <div className="bg-sub" style={{ marginTop: 6 }}>📅 {fmtData(b.orario_partenza_previsto)}</div>
                        )}
                      </td>

                      {/* COMPAGNIA + CODICI */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{formattaEnum(b.compagnia)}</div>
                        <div>
                          {b.codice_prenotazione && <span className="bg-chip" title="Codice prenotazione">PNR {b.codice_prenotazione}</span>}
                          {b.codice_volo && <span className="bg-chip" title="Codice volo">✈ {b.codice_volo}</span>}
                          {b.codice_treno && <span className="bg-chip" title="Codice treno">🚆 {b.codice_treno}</span>}
                          {!b.codice_prenotazione && !b.codice_volo && !b.codice_treno && <span className="bg-sub">-</span>}
                        </div>
                      </td>

                      {/* COSTO + DA RIMBORSARE */}
                      <td>
                        <div className="bg-costo">{fmtEuro(b.costo)}</div>
                        {b.da_rimborsare_ospite && <span className="bg-chip bg-warn">Da rimborsare</span>}
                      </td>

                      {/* STATO (cambio rapido, pillola colorata) */}
                      <td>
                        <select
                          className={`bg-stato stato-${b.stato}`}
                          value={b.stato}
                          onChange={(e) => cambiaStatoRapido(b.id, e.target.value)}
                          aria-label="Cambia stato"
                        >
                          {STATI_BIGLIETTO.map((s) => (
                            <option key={s} value={s}>{STATO_ICONA[s]} {formattaEnum(s)}</option>
                          ))}
                        </select>
                      </td>

                      {/* FATTURA */}
                      <td>
                        {b.file_fattura
                          ? <a className="bg-link" href={`http://localhost:3000/uploads/fatture/${b.file_fattura}`} target="_blank" rel="noreferrer">📄 Vedi</a>
                          : <span className="bg-sub">-</span>}
                      </td>

                      {/* AZIONI */}
                      <td>
                        <div className="bg-azioni">
                          <button type="button" className="bg-btn" onClick={() => apriModifica(b)}>✎ Modifica</button>
                          <button type="button" className="bg-btn bg-del" onClick={() => eliminaBiglietto(b.id)}>✕ Elimina</button>
                        </div>
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