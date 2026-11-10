import { useState, useEffect, useMemo } from 'react';
import { api } from '../../api.js';

const AEROPORTO_FALLBACK = 'Aeroporto di Cagliari';
// Per le partenze da Cagliari il pickup proposto è X minuti prima del volo (0 = stesso orario del volo)
const ANTICIPO_PARTENZA_MIN = 180;

const ETICHETTE_PASSEGGERI = { persona: 'Persone', accompagnatore: 'Accompagnatori', ospite: 'Ospiti' };
const ETICHETTE_LUOGHI = { aeroporto: 'Aeroporto', alloggio: 'Alloggi / B&B', altro: 'Altri luoghi' };

// ---------- utilità ----------

function formattaPerInput(dataISO) {
  if (!dataISO) return '';
  const d = new Date(dataISO);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const formattaDataOra = (iso) =>
  new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const formattaOra = (iso) =>
  new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

const nomeCompleto = (p) => `${p.nome} ${p.cognome}`;

const COLORI_DEFAULT = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
const HEX = /^#[0-9a-fA-F]{6}$/;
const normalizzaHex = (v) => { const t = String(v || '').trim(); return t.startsWith('#') ? t : `#${t}`; };

// Sfondo chiaro a partire da un colore esadecimale
function schiarisci(hex, alpha = 0.2) {
  if (!HEX.test(hex || '')) return undefined;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// ---------- componenti piccoli ----------

const stileMini = { padding: '2px 8px', fontSize: '0.8rem', lineHeight: 1.4, minWidth: 0 };

function InterruttoreVisibilita({ visibile, disabilitato, onClick }) {
  const titolo = disabilitato
    ? 'Assegna prima un runner'
    : visibile ? 'Visibile al runner: clicca per nascondere' : 'Nascosto al runner: clicca per mostrare';
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={disabilitato}
      title={titolo}
      aria-label={titolo}
      onClick={onClick}
      style={{ ...stileMini, color: visibile ? '#10b981' : 'var(--text-muted)', borderColor: visibile ? '#10b981' : undefined }}
    >
      {visibile ? '👁' : '🚫'}
    </button>
  );
}

function BottoneIcona({ icona, titolo, onClick, colore }) {
  return (
    <button type="button" className="btn-secondary" title={titolo} aria-label={titolo} onClick={onClick}
      style={{ ...stileMini, color: colore }}>
      {icona}
    </button>
  );
}

// Il nome porta al profilo dell'utente; gli ospiti senza account restano testo semplice
function NomePersona({ nome, cognome, username }) {
  if (!username) return <strong>{nome} {cognome}</strong>;
  return (
    <a href={`/profile/${encodeURIComponent(username)}`} title="Apri il profilo" style={{ color: 'inherit', fontWeight: 'bold' }}>
      {nome} {cognome}
    </a>
  );
}

function ModaleColori({ runners, coloreDi, onChiudi, onSalva }) {
  const [bozze, setBozze] = useState(() => Object.fromEntries(runners.map((r) => [r.id, coloreDi(r.id)])));
  const [inInvio, setInInvio] = useState(false);
  const validi = runners.every((r) => HEX.test(normalizzaHex(bozze[r.id])));

  async function salva() {
    setInInvio(true);
    try {
      const modificati = runners
        .map((r) => ({ id: r.id, colore: normalizzaHex(bozze[r.id]).toLowerCase() }))
        .filter((x) => x.colore !== coloreDi(x.id).toLowerCase());
      if (modificati.length > 0) await onSalva(modificati);
      onChiudi();
    } catch (err) {
      alert('Errore salvataggio colori: ' + err.message);
    } finally {
      setInInvio(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ marginTop: 0 }}>Colori dei runner</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>Scegli il colore o scrivi il codice esadecimale (es. #3b82f6).</p>
        {runners.length === 0 && <p>Nessun runner disponibile.</p>}
        {runners.map((r) => {
          const v = normalizzaHex(bozze[r.id]);
          const ok = HEX.test(v);
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <input
                type="color"
                value={ok ? v.toLowerCase() : '#cccccc'}
                onChange={(e) => setBozze((b) => ({ ...b, [r.id]: e.target.value }))}
                style={{ width: 40, height: 32, padding: 0 }}
              />
              <input
                type="text"
                value={bozze[r.id]}
                maxLength={7}
                placeholder="#3b82f6"
                onChange={(e) => setBozze((b) => ({ ...b, [r.id]: e.target.value }))}
                style={{ width: 110, borderColor: ok ? undefined : '#ef4444' }}
              />
              <span style={{ flex: 1, padding: '4px 10px', borderRadius: 6, background: ok ? schiarisci(v) : undefined }}>
                {r.nome} {r.cognome}
              </span>
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onChiudi} style={{ flex: 1 }}>Annulla</button>
          <button type="button" onClick={salva} disabled={!validi || inInvio} style={{ flex: 2 }}>
            {inInvio ? 'Salvataggio...' : 'Salva colori'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelettoreLuogo({ etichetta, valore, onChange, luoghi, onCreaLuogo }) {
  const [nuovo, setNuovo] = useState(false);
  const [bozza, setBozza] = useState({ nome: '', indirizzo: '' });
  const [errore, setErrore] = useState('');
  const [inSalvataggio, setInSalvataggio] = useState(false);

  const valoreNoto = luoghi.some((l) => l.nome === valore);

  async function crea() {
    if (!bozza.nome.trim()) { setErrore('Serve un nome per il luogo'); return; }
    setInSalvataggio(true);
    setErrore('');
    try {
      const luogo = await onCreaLuogo({ nome: bozza.nome.trim(), indirizzo: bozza.indirizzo.trim() });
      onChange(luogo.nome);
      setBozza({ nome: '', indirizzo: '' });
      setNuovo(false);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInSalvataggio(false);
    }
  }

  return (
    <div style={{ flex: 1 }}>
      <label>{etichetta}:
        <select
          value={valore}
          onChange={(e) => (e.target.value === '__nuovo__' ? setNuovo(true) : onChange(e.target.value))}
        >
          <option value="">-- Da decidere --</option>
          {valore && !valoreNoto && <option value={valore}>{valore}</option>}
          {['aeroporto', 'alloggio', 'altro'].map((tipo) => {
            const lista = luoghi.filter((l) => l.tipo === tipo);
            if (lista.length === 0) return null;
            return (
              <optgroup key={tipo} label={ETICHETTE_LUOGHI[tipo]}>
                {lista.map((l) => <option key={l.chiave} value={l.nome}>{l.nome}</option>)}
              </optgroup>
            );
          })}
          <option value="__nuovo__">➕ Altro luogo...</option>
        </select>
      </label>

      {nuovo && (
        <div style={{ marginTop: '0.5rem', padding: '0.75rem', border: '1px dashed var(--text-muted)', borderRadius: '8px' }}>
          <input
            type="text"
            placeholder="Nome del luogo"
            value={bozza.nome}
            onChange={(e) => setBozza((b) => ({ ...b, nome: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Indirizzo (serve per la mappa)"
            value={bozza.indirizzo}
            onChange={(e) => setBozza((b) => ({ ...b, indirizzo: e.target.value }))}
            style={{ marginTop: '0.5rem' }}
          />
          {errore && <p style={{ color: '#ef4444', margin: '0.5rem 0 0' }}>{errore}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => { setNuovo(false); setErrore(''); }}>Annulla</button>
            <button type="button" onClick={crea} disabled={inSalvataggio}>
              {inSalvataggio ? 'Salvataggio...' : 'Salva luogo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- pagina ----------

export default function GestioneTransfer() {
  const [biglietti, setBiglietti] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [runners, setRunners] = useState([]);
  const [luoghi, setLuoghi] = useState([]);
  const [passeggeriTutti, setPasseggeriTutti] = useState([]);
  const [coloriRunner, setColoriRunner] = useState({});
  const [coloriAperto, setColoriAperto] = useState(false);
  const [caricamento, setCaricamento] = useState(true);


  const [form, setForm] = useState(null); // null = modale chiusa
  const [proposte, setProposte] = useState([]); // accompagnatori da proporre
  const [inInvio, setInInvio] = useState(false);

  useEffect(() => { caricaTutto(); }, []);

  async function caricaTutto() {
    setCaricamento(true);
    try {
      const [resBiglietti, resTransfers, resRunners, resLuoghi, resPasseggeri, resColori] = await Promise.all([
        api('/biglietti/elenco-biglietti-da-per-cagliari'),
        api('/transfer/elenco-transfer'),
        api('/profile/elenco-runners'),
        api('/transfer/elenco-luoghi'),
        api('/transfer/elenco-passeggeri'),
        api('/transfer/colori-runner')
      ]);
      setBiglietti(resBiglietti);
      setTransfers(resTransfers);
      setRunners(resRunners);
      setLuoghi(resLuoghi);
      setPasseggeriTutti(resPasseggeri);
      setColoriRunner(Object.fromEntries(resColori.map((c) => [c.id_runner, c.colore])));
    } catch (err) {
      alert('Errore nel caricamento: ' + err.message);
    } finally {
      setCaricamento(false);
    }
  }

  async function ricaricaTransfer() {
    setTransfers(await api('/transfer/elenco-transfer'));
  }

  const aeroporto = luoghi.find((l) => l.tipo === 'aeroporto')?.nome || AEROPORTO_FALLBACK;

  const coloreRunner = (id) => coloriRunner[id] || COLORI_DEFAULT[Number(id) % COLORI_DEFAULT.length];

  async function salvaColori(lista) {
    await Promise.all(lista.map(({ id, colore }) =>
      api(`/transfer/colore-runner/${id}`, { metodo: 'PUT', corpo: { colore } })
    ));
    setColoriRunner((prev) => ({ ...prev, ...Object.fromEntries(lista.map((x) => [x.id, x.colore])) }));
  }

  const titolari = useMemo(() => new Map(passeggeriTutti.map((p) => [p.chiave, p.titolare])), [passeggeriTutti]);
  const etichettaTipo = (chiave) => {
    if (chiave?.startsWith('a_')) {
      const titolare = titolari.get(chiave);
      return titolare ? ` (accomp. di ${titolare})` : ' (accomp.)';
    }
    return chiave?.startsWith('m_') ? ' (ospite)' : '';
  };

  // ---------- dati derivati ----------

  // Una riga per biglietto da/per Cagliari. L'orario di riferimento dipende dalla direzione:
  // arrivo a Cagliari -> orario di arrivo; partenza da Cagliari -> orario di partenza.
  const tutteRighe = useMemo(() => biglietti.map((b) => {
    const direzione = b.arrivo === 'CAG' ? 'arrivo' : 'partenza';
    const orarioVolo = direzione === 'arrivo'
      ? (b.orario_arrivo_previsto || b.orario_partenza_previsto)
      : (b.orario_partenza_previsto || b.orario_arrivo_previsto);
    const transfer = transfers.find((t) => t.id_biglietto === b.id) || null;
    return { ...b, direzione, orarioVolo, transfer, orarioRiferimento: transfer?.orario_pickup || orarioVolo };
  }), [biglietti, transfers]);

  // Un "transfer" = righe con lo stesso id_gruppo (o la riga singola, per i transfer vecchi)
  const gruppi = useMemo(() => {
    const mappa = new Map();
    for (const t of transfers) {
      const chiave = t.id_gruppo || `t_${t.id}`;
      if (!mappa.has(chiave)) mappa.set(chiave, { chiave, righe: [] });
      mappa.get(chiave).righe.push(t);
    }
    return [...mappa.values()].map((g) => {
      const p = g.righe[0];
      return {
        ...g,
        ids: g.righe.map((r) => r.id),
        id_runner: p.id_runner,
        nome_runner: p.nome_runner,
        cognome_runner: p.cognome_runner,
        orario_pickup: p.orario_pickup,
        luogo_pickup: p.luogo_pickup,
        luogo_destinazione: p.luogo_destinazione,
        visibile: g.righe.every((r) => r.visibile_al_runner)
      };
    });
  }, [transfers]);

  // Un'unica lista: i transfer (uno per gruppo) + i biglietti ancora senza transfer.
  // Ordine: per orario; a parità di orario le righe dello stesso runner stanno insieme.
  const righeTabella = useMemo(() => {
    const righe = [];
    for (const g of gruppi) {
      const biglietti = g.righe
        .map((t) => tutteRighe.find((r) => r.id === t.id_biglietto))
        .filter(Boolean);
      righe.push({
        chiave: g.chiave, tipo: 'transfer', gruppo: g, biglietti,
        direzione: biglietti[0]?.direzione || null,
        orario: g.orario_pickup || biglietti[0]?.orarioVolo || null,
        idRunner: g.id_runner || null,
        nomeRunner: g.id_runner ? `${g.nome_runner} ${g.cognome_runner}` : ''
      });
    }
    for (const r of tutteRighe) {
      if (r.transfer) continue;
      righe.push({
        chiave: `b_${r.id}`, tipo: 'biglietto', riga: r, biglietti: [r],
        direzione: r.direzione, orario: r.orarioVolo, idRunner: null, nomeRunner: ''
      });
    }
    return righe
      .map((r) => ({ ...r, minuto: r.orario ? formattaPerInput(r.orario) : '' }))
      .sort((a, b) => {
        if (a.minuto !== b.minuto) {
          if (!a.minuto) return 1;
          if (!b.minuto) return -1;
          return a.minuto < b.minuto ? -1 : 1;
        }
        if (Boolean(a.idRunner) !== Boolean(b.idRunner)) return a.idRunner ? -1 : 1;
        return a.nomeRunner.localeCompare(b.nomeRunner);
      });
  }, [gruppi, tutteRighe]);

  // ---------- visibilità / eliminazione ----------

  async function impostaVisibilita(ids, visibile) {
    const precedente = transfers;
    setTransfers((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, visibile_al_runner: visibile } : t)));
    try {
      await api('/transfer/visibilita', { metodo: 'PATCH', corpo: { ids, visibile } });
    } catch (err) {
      setTransfers(precedente);
      alert('Errore aggiornamento visibilità: ' + err.message);
    }
  }

  async function eliminaGruppo(g) {
    const n = g.righe.length;
    if (!window.confirm(`Eliminare questo transfer (${n} ${n === 1 ? 'passeggero' : 'passeggeri'})?`)) return;
    try {
      await api(`/transfer/elimina-gruppo?ids=${g.ids.join(',')}`, { metodo: 'DELETE' });
      setTransfers((prev) => prev.filter((t) => !g.ids.includes(t.id)));
    } catch (err) {
      alert('Errore eliminazione: ' + err.message);
    }
  }

  // ---------- modale ----------

  function chiudiModale() {
    setForm(null);
    setProposte([]);
  }

  // Collega al passeggero il suo biglietto da/per Cagliari più vicino, se non ha già un transfer
  function trovaBiglietto(chiave, ctx) {
    if (!ctx.direzione) return null;
    const rif = new Date(ctx.orarioRif || ctx.orario_pickup || 0).getTime();
    const candidati = tutteRighe
      .filter((r) => r.chiave_passeggero === chiave && r.direzione === ctx.direzione && !r.transfer)
      .sort((a, b) => Math.abs(new Date(a.orarioVolo) - rif) - Math.abs(new Date(b.orarioVolo) - rif));
    return candidati[0]?.id ?? null;
  }

  async function proponiAccompagnatori(passeggero, giaPresenti) {
    if (!passeggero.chiave.startsWith('p_')) return;
    try {
      const lista = await api(`/transfer/accompagnatori/${passeggero.chiave.slice(2)}`);
      const nuovi = lista
        .map((a) => ({ chiave: `a_${a.id}`, nome: a.nome, cognome: a.cognome }))
        .filter((a) => !giaPresenti.some((x) => x.chiave === a.chiave));
      if (nuovi.length > 0) {
        setProposte((prev) => [
          ...prev.filter((x) => x.titolare !== passeggero.chiave),
          { titolare: passeggero.chiave, nomeTitolare: nomeCompleto(passeggero), accompagnatori: nuovi }
        ]);
      }
    } catch {
      // la proposta è opzionale: se fallisce si va avanti senza
    }
  }

  function aggiungiPasseggeri(nuovi) {
    setForm((prev) => {
      const presenti = new Set(prev.passeggeri.map((p) => p.chiave));
      const aggiunti = nuovi
        .filter((p) => !presenti.has(p.chiave))
        .map((p) => ({ ...p, id_biglietto: p.id_biglietto ?? trovaBiglietto(p.chiave, prev) }));
      return { ...prev, passeggeri: [...prev.passeggeri, ...aggiunti] };
    });
  }

  function rimuoviPasseggero(chiave) {
    setForm((prev) => ({ ...prev, passeggeri: prev.passeggeri.filter((p) => p.chiave !== chiave) }));
  }

  function aggiornaForm(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function apriNuovo() {
    setForm({
      ids_esistenti: [], direzione: null, orarioRif: null,
      id_runner: '', orario_pickup: '', luogo_pickup: '', luogo_destinazione: '',
      visibile_al_runner: false, passeggeri: []
    });
    setProposte([]);
  }

  function apriModifica(g) {
    const rigaBiglietto = tutteRighe.find((r) => g.righe.some((t) => t.id_biglietto === r.id));
    setForm({
      ids_esistenti: g.ids,
      direzione: rigaBiglietto?.direzione || null,
      orarioRif: rigaBiglietto?.orarioVolo || null,
      id_runner: g.id_runner || '',
      orario_pickup: g.orario_pickup ? formattaPerInput(g.orario_pickup) : '',
      luogo_pickup: g.luogo_pickup || '',
      luogo_destinazione: g.luogo_destinazione || '',
      visibile_al_runner: g.visibile,
      passeggeri: g.righe.map((r) => ({
        chiave: r.chiave_passeggero, nome: r.nome_persona, cognome: r.cognome_persona, id_biglietto: r.id_biglietto
      }))
    });
    setProposte([]);
  }

  function apriDaBiglietto(riga) {
    if (riga.transfer) {
      const gruppo = gruppi.find((g) => g.ids.includes(riga.transfer.id));
      if (gruppo) { apriModifica(gruppo); return; }
    }

    const arrivo = riga.direzione === 'arrivo';
    // Arrivo: pickup all'orario del volo. Partenza: pickup un po' prima del volo.
    const pickup = !riga.orarioVolo ? ''
      : arrivo ? riga.orarioVolo
      : new Date(new Date(riga.orarioVolo).getTime() - ANTICIPO_PARTENZA_MIN * 60000);

    const passeggero = { chiave: riga.chiave_passeggero, nome: riga.nome, cognome: riga.cognome, id_biglietto: riga.id };
    setForm({
      ids_esistenti: [],
      direzione: riga.direzione,
      orarioRif: riga.orarioVolo,
      id_runner: '',
      orario_pickup: formattaPerInput(pickup),
      // Aeroporto preimpostato: pickup se arriva, destinazione se parte
      luogo_pickup: arrivo ? aeroporto : '',
      luogo_destinazione: arrivo ? '' : aeroporto,
      visibile_al_runner: false,
      passeggeri: [passeggero]
    });
    setProposte([]);
    proponiAccompagnatori(passeggero, []);
  }

  async function creaLuogo(dati) {
    const luogo = await api('/transfer/aggiungi-luogo', { metodo: 'POST', corpo: dati });
    setLuoghi((prev) => [...prev, luogo]);
    return luogo;
  }

  async function salvaTransfer(e) {
    e.preventDefault();
    if (form.passeggeri.length === 0) { setForm((prev) => ({ ...prev, tentato: true })); return; }
    setInInvio(true);
    try {
      await api('/transfer/salva-gruppo', {
        metodo: 'POST',
        corpo: {
          ids_esistenti: form.ids_esistenti,
          id_runner: form.id_runner ? Number(form.id_runner) : null,
          orario_pickup: form.orario_pickup || null,
          luogo_pickup: form.luogo_pickup,
          luogo_destinazione: form.luogo_destinazione,
          visibile_al_runner: form.visibile_al_runner,
          passeggeri: form.passeggeri.map((p) => ({ chiave: p.chiave, id_biglietto: p.id_biglietto || null }))
        }
      });
      await ricaricaTransfer();
      chiudiModale();
    } catch (err) {
      alert('Errore salvataggio: ' + err.message);
    } finally {
      setInInvio(false);
    }
  }

  const passeggeriDisponibili = form
    ? passeggeriTutti.filter((p) => !form.passeggeri.some((x) => x.chiave === p.chiave))
    : [];

  // Il rosso compare solo se si prova a salvare senza passeggeri
  const passeggeroMancante = Boolean(form?.tentato) && form.passeggeri.length === 0;

  // ---------- render ----------

  function renderGiorno(giorno, righe) {
    const conRunner = righe.filter((x) => x.gruppo?.id_runner);
    const idsGiorno = conRunner.flatMap((x) => x.gruppo.ids);
    const nVisibili = conRunner.filter((x) => x.gruppo.visibile).length;
    const tuttoVisibile = conRunner.length > 0 && nVisibili === conRunner.length;
    const titolo = giorno
      ? new Date(`${giorno}T12:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'Senza data';

    return (
      <section key={giorno || 'senza-data'} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{titolo}</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {nVisibili}/{conRunner.length} visibili al runner
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={stileMini}
            disabled={conRunner.length === 0}
            title="Agisce sui transfer del giorno che hanno già un runner"
            onClick={() => impostaVisibilita(idsGiorno, !tuttoVisibile)}
          >
            {tuttoVisibile ? '🚫 Nascondi tutto il giorno' : '👁 Rendi visibile tutto il giorno'}
          </button>
        </div>

        <div className="table-container">
          <table className="tabella-transfer">
            <thead>
              <tr>
                <th>Ospiti</th>
                <th>Tratta</th>
                <th>Orario Volo/Treno</th>
                <th>Orario Pickup</th>
                <th>Pickup &rarr; Destinazione</th>
                <th>Runner</th>
                <th>Visibile</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {righe.map((r, i) => {
                const g = r.gruppo;
                const colore = r.idRunner ? coloreRunner(r.idRunner) : null;

                // Il runner è una cella unica per le righe consecutive con stesso orario e stesso runner
                const prec = righe[i - 1];
                const inizioBlocco = !(prec && r.idRunner && prec.idRunner === r.idRunner && prec.minuto === r.minuto);
                let span = 1;
                if (inizioBlocco && r.idRunner) {
                  while (righe[i + span] && righe[i + span].idRunner === r.idRunner && righe[i + span].minuto === r.minuto) span++;
                }

                const tratte = [...new Map(r.biglietti.map((b) => [`${b.partenza}${b.arrivo}`, b])).values()];
                const orariVolo = [...new Set(r.biglietti.map((b) => b.orarioVolo).filter(Boolean).map(formattaDataOra))];

                return (
                  <tr key={r.chiave} style={{ background: colore ? schiarisci(colore) : 'rgba(239,68,68,0.12)' }}>
                    <td>
                      {g
                        ? g.righe.map((t) => (
                            <div key={t.id}><NomePersona nome={t.nome_persona} cognome={t.cognome_persona} username={t.username_persona} />
                              <span style={{ color: 'var(--text-muted)' }}>{etichettaTipo(t.chiave_passeggero)}</span>
                            </div>
                          ))
                        : (
                            <div><NomePersona nome={r.riga.nome} cognome={r.riga.cognome} username={r.riga.username_persona} />
                              <span style={{ color: 'var(--text-muted)' }}>{etichettaTipo(r.riga.chiave_passeggero)}</span>
                            </div>
                          )}
                    </td>
                    <td>
                      {tratte.length === 0 ? '—' : tratte.map((b) => (
                        <div key={`${b.partenza}${b.arrivo}`}>{b.partenza} &rarr; {b.arrivo}</div>
                      ))}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {orariVolo.length === 0 ? '—' : orariVolo.map((o) => <div key={o}>{o}</div>)}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>
                      {g?.orario_pickup ? formattaOra(g.orario_pickup) : <span style={{ color: '#ef4444' }}>Da definire</span>}
                    </td>
                    <td>{g?.luogo_pickup || <span style={{ color: '#ef4444' }}>?</span>} &rarr; {g?.luogo_destinazione || <span style={{ color: '#ef4444' }}>?</span>}</td>
                    {inizioBlocco && (
                      <td rowSpan={span}>
                        {r.idRunner
                          ? <span style={{ fontWeight: 'bold' }}><span style={{ color: colore }}>●</span> {r.nomeRunner}</span>
                          : <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Nessuno</span>}
                      </td>
                    )}
                    <td>
                      {g ? (
                        <InterruttoreVisibilita
                          visibile={g.visibile}
                          disabilitato={!g.id_runner}
                          onClick={() => impostaVisibilita(g.ids, !g.visibile)}
                        />
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <BottoneIcona
                          icona="✏️"
                          titolo={g ? 'Modifica transfer' : 'Assegna runner e crea il transfer'}
                          onClick={() => (g ? apriModifica(g) : apriDaBiglietto(r.riga))}
                        />
                        {g && <BottoneIcona icona="🗑️" titolo="Elimina transfer" onClick={() => eliminaGruppo(g)} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderTabella() {
    if (righeTabella.length === 0) {
      return <p style={{ color: 'var(--text-muted)' }}>Nessun transfer o biglietto da mostrare.</p>;
    }
    // righeTabella è già ordinata per orario: basta spezzarla quando cambia il giorno
    const giorni = [];
    for (const r of righeTabella) {
      const giorno = r.minuto.slice(0, 10);
      const ultimo = giorni[giorni.length - 1];
      if (ultimo && ultimo.giorno === giorno) ultimo.righe.push(r);
      else giorni.push({ giorno, righe: [r] });
    }
    return giorni.map((g) => renderGiorno(g.giorno, g.righe));
  }

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>Piano transfer</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={() => setColoriAperto(true)}>🎨 Colori runner</button>
            <button onClick={apriNuovo}>+ Nuovo transfer</button>
          </div>
        </div>

        <style>{'.tabella-transfer th, .tabella-transfer td { font-size: 0.9rem; padding: 5px 8px; }'}</style>
        {caricamento ? <p>Caricamento dati in corso...</p> : renderTabella()}
      </div>

      {form && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0 }}>
              {form.ids_esistenti.length > 0 ? 'Modifica transfer' : 'Nuovo transfer'}
            </h2>
            <form onSubmit={salvaTransfer}>
              <div>
                <strong>Passeggeri ({form.passeggeri.length})</strong>
                {passeggeroMancante && (
                  <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>Aggiungi almeno un passeggero</span>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                  {form.passeggeri.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Nessun passeggero: aggiungine uno qui sotto.</span>}
                  {form.passeggeri.map((p) => (
                    <span key={p.chiave} style={{ padding: '4px 10px', borderRadius: '999px', border: '1px solid var(--text-muted)' }}>
                      {p.nome} {p.cognome}{' '}
                      <button type="button" onClick={() => rimuoviPasseggero(p.chiave)} title="Rimuovi" style={{ all: 'unset', cursor: 'pointer', color: '#ef4444' }}>×</button>
                    </span>
                  ))}
                </div>

                {proposte.map((pr) => (
                  <div key={pr.titolare} style={{ padding: '0.75rem', margin: '0.5rem 0', borderRadius: '8px', background: 'rgba(245,158,11,0.12)' }}>
                    <div><strong>{pr.nomeTitolare}</strong> ha {pr.accompagnatori.length === 1 ? 'un accompagnatore' : `${pr.accompagnatori.length} accompagnatori`}. Li aggiungi a questo transfer?</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {pr.accompagnatori.map((a) => (
                        <button type="button" className="btn-secondary" key={a.chiave}
                          onClick={() => {
                            aggiungiPasseggeri([a]);
                            setProposte((prev) => prev
                              .map((x) => (x.titolare === pr.titolare ? { ...x, accompagnatori: x.accompagnatori.filter((y) => y.chiave !== a.chiave) } : x))
                              .filter((x) => x.accompagnatori.length > 0));
                          }}>
                          + {a.nome} {a.cognome}
                        </button>
                      ))}
                      {pr.accompagnatori.length > 1 && (
                        <button type="button" onClick={() => {
                          aggiungiPasseggeri(pr.accompagnatori);
                          setProposte((prev) => prev.filter((x) => x.titolare !== pr.titolare));
                        }}>
                          Aggiungi tutti
                        </button>
                      )}
                      <button type="button" className="btn-secondary"
                        onClick={() => setProposte((prev) => prev.filter((x) => x.titolare !== pr.titolare))}>
                        No, grazie
                      </button>
                    </div>
                  </div>
                ))}

                <select
                  value=""
                  style={passeggeroMancante ? { borderColor: '#ef4444' } : undefined}
                  onChange={(e) => {
                    const scelto = passeggeriTutti.find((p) => p.chiave === e.target.value);
                    if (!scelto) return;
                    const nuovo = { chiave: scelto.chiave, nome: scelto.nome, cognome: scelto.cognome };
                    aggiungiPasseggeri([nuovo]);
                    if (scelto.tipo === 'persona') proponiAccompagnatori(nuovo, form.passeggeri);
                  }}
                >
                  <option value="">+ Aggiungi un passeggero...</option>
                  {['persona', 'accompagnatore', 'ospite'].map((tipo) => {
                    const lista = passeggeriDisponibili.filter((p) => p.tipo === tipo);
                    if (lista.length === 0) return null;
                    return (
                      <optgroup key={tipo} label={ETICHETTE_PASSEGGERI[tipo]}>
                        {lista.map((p) => (
                          <option key={p.chiave} value={p.chiave}>
                            {p.cognome} {p.nome}{p.titolare ? ` (accomp. di ${p.titolare})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <label>Runner:
                <select name="id_runner" value={form.id_runner} onChange={aggiornaForm}>
                  <option value="">-- Nessun runner (lascia in sospeso) --</option>
                  {runners.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} {p.cognome}</option>
                  ))}
                </select>
              </label>

              <label>Orario pickup:
                <input name="orario_pickup" type="datetime-local" value={form.orario_pickup} onChange={aggiornaForm} />
              </label>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <SelettoreLuogo
                  etichetta="Luogo pickup"
                  valore={form.luogo_pickup}
                  onChange={(v) => setForm((prev) => ({ ...prev, luogo_pickup: v }))}
                  luoghi={luoghi}
                  onCreaLuogo={creaLuogo}
                />
                <SelettoreLuogo
                  etichetta="Destinazione"
                  valore={form.luogo_destinazione}
                  onChange={(v) => setForm((prev) => ({ ...prev, luogo_destinazione: v }))}
                  luoghi={luoghi}
                  onCreaLuogo={creaLuogo}
                />
              </div>

              <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
                <input name="visibile_al_runner" type="checkbox" checked={form.visibile_al_runner} onChange={aggiornaForm} style={{ marginTop: 0 }} />
                Rendi visibile nell'app del runner
              </label>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={chiudiModale} style={{ flex: 1 }}>Annulla</button>
                <button type="submit" disabled={inInvio} style={{ flex: 2 }}>
                  {inInvio ? 'Salvataggio...' : 'Salva transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {coloriAperto && (
        <ModaleColori
          runners={runners}
          coloreDi={coloreRunner}
          onChiudi={() => setColoriAperto(false)}
          onSalva={salvaColori}
        />
      )}
    </>
  );
}