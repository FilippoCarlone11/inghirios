import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

import { formattaEnum, fmtData, fmtOra, nomeLuogo } from '../utils.js';

export default function Profilo() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [datiProfilo, setDatiProfilo] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');

  const [formExtra, setFormExtra] = useState({ aperto: false, id_selezionato: '', descrizione: '', importo: '' });

  const caricaDati = () => {
    api(`/profile/${username}`)
      .then((dati) => setDatiProfilo(dati))
      .catch((err) => setErrore(err.message))
      .finally(() => setCaricamento(false));
  };

  useEffect(() => {
    setCaricamento(true);
    caricaDati();
  }, [username]);

  const gestisciRimborsoBiglietto = async (id, nuovoStato) => {
    try {
      await api(`/biglietti/cambia-stato/${id}`, { 
        metodo: 'PATCH', 
        corpo: { stato: nuovoStato } 
      });
      caricaDati();
    } catch (error) {
      alert("Errore aggiornamento biglietto: " + error.message);
    }
  };

  // AGGIORNATO per inviare lo stato "rimborsato"
  const gestisciRimborsoAlloggio = async (id, statoRimborsato) => {
    try {
      await api(`/alloggi/aggiorna-rimborso-notte/${id}`, { 
        metodo: 'PATCH', 
        corpo: { rimborsato: statoRimborsato } 
      });
      caricaDati();
    } catch (error) {
      alert("Errore aggiornamento alloggio: " + error.message);
    }
  };

  const gestisciAltroRimborso = async (id, rimborsato) => {
    try {
      await api(`/profile/cambia-stato-rimborso/${id}`, { 
        metodo: 'PATCH', 
        corpo: { rimborsato: rimborsato } 
      });
      caricaDati();
    } catch (error) {
      alert("Errore aggiornamento spesa extra: " + error.message);
    }
  };

  const aggiungiSpesaExtra = async (e) => {
    e.preventDefault();
    try {
      await api('/profile/aggiungi-altro-rimborso', {
        metodo: 'POST',
        corpo: {
          id_selezionato: formExtra.id_selezionato,
          descrizione: formExtra.descrizione,
          importo: formExtra.importo,
          id_utente_principale: datiProfilo.datiPersonali.id
        }
      });
      setFormExtra({ aperto: false, id_selezionato: '', descrizione: '', importo: '' });
      caricaDati();
    } catch (error) {
      alert("Errore inserimento spesa: " + error.message);
    }
  };

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento profilo in corso...</p>;
  if (errore) return <p style={{ padding: '2rem', color: '#ef4444' }}>Errore: {errore}</p>;
  if (!datiProfilo || !datiProfilo.datiPersonali) return <p style={{ padding: '2rem' }}>Profilo non trovato.</p>;

  const { 
    datiPersonali, 
    datiGiurato, 
    membriGruppo, 
    accompagnatori, 
    alloggio, 
    biglietti,
    transfer,
    altri_rimborsi
  } = datiProfilo;

  const opzioniAssegnatari = [
    { value: `p_${datiPersonali.id}`, label: `${datiPersonali.nome} ${datiPersonali.cognome} (Principale)` },
    ...(accompagnatori || []).map(a => ({ value: `a_${a.id}`, label: `${a.nome_accompagnatore || a.nome} (Accompagnatore)`})),
    ...(membriGruppo || []).map(m => ({ value: `m_${m.id}`, label: `${m.nome} (Membro Gruppo)`}))
  ];

  const getNomePasseggero = (item) => {
    if (item.id_accompagnatore) {
      const acc = accompagnatori?.find(a => a.id === item.id_accompagnatore);
      const nomeAcc = acc ? `${acc.nome_accompagnatore || acc.nome} ${acc.cognome_accompagnatore || acc.cognome}` : 'Sconosciuto';
      return `${nomeAcc} (Accompagnatore)`;
    }
    if (item.id_membro_ospite) {
      const membro = membriGruppo?.find(m => m.id === item.id_membro_ospite);
      const nomeMembro = membro ? `${membro.nome} ${membro.cognome}` : 'Sconosciuto';
      return `${nomeMembro} (Membro Gruppo)`;
    }
    if (item.nome_passeggero && !item.id_utente) {
       return `${item.nome_passeggero} ${item.cognome_passeggero || ''}`; 
    }
    return `${datiPersonali.nome} ${datiPersonali.cognome} (Ospite Principale)`;
  };

  const raggruppaAlloggi = (notti) => {
    if (!notti || notti.length === 0) return [];
    const nottiOrdinate = [...notti].sort((a, b) => new Date(a.data) - new Date(b.data));
    const soggiorni = [];

    nottiOrdinate.forEach((notte) => {
      const dataNotte = new Date(notte.data);
      const chiavePersona = notte.id_accompagnatore ? `a_${notte.id_accompagnatore}` : `p_${notte.id_persona}`;
      
      const index = soggiorni.findIndex(s => 
        s.chiavePersona === chiavePersona && 
        s.id_camera === notte.id_camera &&
        s.data_fine.toDateString() === dataNotte.toDateString()
      );

      if (index !== -1) {
        soggiorni[index].data_fine = new Date(dataNotte.getTime() + 86400000);
      } else {
        soggiorni.push({ 
          ...notte, 
          chiavePersona,
          data_inizio: dataNotte, 
          data_fine: new Date(dataNotte.getTime() + 86400000) 
        });
      }
    });
    return soggiorni;
  };

  const soggiorniRaggruppati = raggruppaAlloggi(alloggio);

  // Filtriamo mantenendo tutto ciò che è rimborsabile (sia già pagato che non pagato)
  const bigliettiRimborso = biglietti?.filter(b => b.stato === 'rimborso_richiesto' || b.stato === 'rimborso_ottenuto' || b.da_rimborsare_ospite) || [];
  const nottiRimborso = alloggio?.filter(n => n.da_rimborsare) || [];
  const extraRimborso = altri_rimborsi || []; 

  // Calcoli dei totali escludendo ciò che è già stato rimborsato
  const totaleBiglietti = bigliettiRimborso.filter(b => b.stato !== 'rimborso_ottenuto').reduce((acc, b) => acc + Number(b.costo || 0), 0);
  const totaleAlloggi = nottiRimborso.filter(n => !n.rimborsato).reduce((acc, n) => acc + Number(n.costo_per_notte || 0), 0);
  const totaleExtra = extraRimborso.filter(ar => !ar.rimborsato).reduce((acc, ar) => acc + Number(ar.importo || 0), 0);
  const totaleComplessivo = totaleBiglietti + totaleAlloggi + totaleExtra;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Profilo Utente</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          ← Torna indietro
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: 'var(--primary)' }}>Dati Principali</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          <div><strong>Nome e Cognome:</strong> <br/>{datiPersonali.nome} {datiPersonali.cognome}</div>
          <div><strong>Username:</strong> <br/>{datiPersonali.username}</div>
          <div><strong>Email:</strong> <br/>{datiPersonali.email || '-'}</div>
          <div><strong>Telefono:</strong> <br/>{datiPersonali.telefono || '-'}</div>
          <div><strong>Ruolo:</strong> <br/><span className="badge">{datiPersonali.ruolo.toUpperCase()}</span></div>
        </div>
      </div>

      {datiGiurato && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: '#3b82f6' }}>Dettagli Giuria</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            <div><strong>Tipo Giuria:</strong> <br/>{datiGiurato.tipo_giuria || '-'}</div>
            <div><strong>Partecipazione:</strong> <br/>{datiGiurato.partecipazione || '-'}</div>
            <div><strong>Emittente:</strong> <br/>{datiGiurato.emittente || '-'}</div>
            <div><strong>Liberatoria:</strong> <br/>{datiGiurato.liberatoria_consegnata ? '✅ Consegnata' : '❌ Non consegnata'}</div>
          </div>
        </div>
      )}

      {membriGruppo && membriGruppo.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: 'var(--primary)' }}>Membri del Gruppo</h3>
          <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0 0 0' }}>
            {membriGruppo.map((membro, index) => (
              <li key={index} style={{ padding: '0.5rem 0', borderBottom: '1px dashed var(--border)' }}>👤 {membro.nome} {membro.cognome}</li>
            ))}
          </ul>
        </div>
      )}

      {accompagnatori && accompagnatori.length > 0 && (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: 'var(--primary)' }}>Accompagnatori</h3>
        <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0 0 0' }}>
          {accompagnatori.map((acc, index) => (
            <li key={index} style={{ padding: '0.5rem 0', borderBottom: '1px dashed var(--border)' }}>👥 {acc.nome_accompagnatore || acc.nome} {acc.cognome_accompagnatore || acc.cognome}</li>
          ))}
        </ul>
      </div>
      )}

      {soggiorniRaggruppati.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: '#10b981' }}>Pernottamenti</h3>
          <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0 0 0' }}>
            {soggiorniRaggruppati.map((soggiorno, i) => (
              <li key={i} style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <strong style={{ color: 'var(--primary)' }}>👤 {getNomePasseggero(soggiorno)}</strong> <br/>
                🏨 {soggiorno.nome_alloggio} <br/>
                📅 Dal <strong>{soggiorno.data_inizio.toLocaleDateString('it-IT')}</strong> al <strong>{soggiorno.data_fine.toLocaleDateString('it-IT')}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {transfer && transfer.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #8b5cf6' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: '#8b5cf6' }}>Transfer Organizzati</h3>
          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Data e Ora</th>
                  <th>Punto di Partenza</th>
                  <th>Destinazione</th>
                  <th>Runner Assegnato</th>
                </tr>
              </thead>
              <tbody>
                {transfer.map((t, index) => {
                  const dataGrezza = new Date(t.orario_pickup);
                  const dataFormattata = isNaN(dataGrezza.getTime()) 
                    ? '-' : dataGrezza.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={index}>
                      <td><strong>{dataFormattata}</strong></td>
                      <td>{t.luogo_pickup || '-'}</td>
                      <td>{t.luogo_destinazione || '-'}</td>
                      <td>
                        {t.nome_runner || t.cognome_runner 
                          ? `${t.nome_runner || ''} ${t.cognome_runner || ''}`.trim() : <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Da assegnare</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {biglietti && biglietti.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: '#f59e0b' }}>Biglietti</h3>
          <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0 0 0' }}>
            {biglietti.map((b) => (
              <li key={b.id} style={{ marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f1efeb', padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: 'bold' }}>
                  🎫 Passeggero: {getNomePasseggero(b)}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div className="bg-tratta">
                      <div>
                        <div className="bg-iata">{b.partenza}</div>
                        <div className="bg-sub">{nomeLuogo(b.partenza)}</div>
                      </div>
                      <span className="bg-freccia">→</span>
                      <div>
                        <div className="bg-iata">{b.arrivo}</div>
                        <div className="bg-sub">{nomeLuogo(b.arrivo)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{formattaEnum(b.compagnia)}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <strong>Costo:</strong> €{Number(b.costo || 0).toFixed(2)}
                    </div>
                  </div> 
                </div>             
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #ef4444' }}>
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: '#ef4444' }}>Gestione Rimborsi</h3>
        
        {(!bigliettiRimborso.length && !nottiRimborso.length && !extraRimborso.length) && (
          <p style={{ color: 'var(--text-muted)' }}>Non ci sono rimborsi registrati per questo utente.</p>
        )}

        {bigliettiRimborso.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Biglietti</h4>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {bigliettiRimborso.map(b => {
                const rimborsato = b.stato === 'rimborso_ottenuto';
                return (
                  <li key={`rimborso-b-${b.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px dashed #e5e7eb', opacity: rimborsato ? 0.6 : 1 }}>
                    <div>
                      <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>👤 {getNomePasseggero(b)}</span><br/>
                      Tratta: <strong>{b.partenza} → {b.arrivo}</strong> <br/>
                      Costo: <strong>€{Number(b.costo || 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      <button 
                        onClick={() => gestisciRimborsoBiglietto(b.id, rimborsato ? 'rimborso_richiesto' : 'rimborso_ottenuto')} 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: rimborsato ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '130px' }}
                      >
                        {rimborsato ? 'Rimborsato' : 'Da rimborsare'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {nottiRimborso.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Alloggi</h4>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {nottiRimborso.map(n => (
                <li key={`rimborso-a-${n.id_occupazione || n.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px dashed #e5e7eb', opacity: n.rimborsato ? 0.6 : 1 }}>
                  <div>
                    <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>👤 {getNomePasseggero(n)}</span><br/>
                    Struttura: <strong>{n.nome_alloggio}</strong> <br/>
                    Notte del: <strong>{fmtData(n.data)}</strong> <br/>
                    Costo: <strong>€{Number(n.costo_per_notte || 0).toFixed(2)}</strong>
                  </div>
                  <div>
                    <button 
                      onClick={() => gestisciRimborsoAlloggio(n.id_occupazione || n.id, !n.rimborsato)} 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: n.rimborsato ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '130px' }}
                    >
                      {n.rimborsato ? 'Rimborsato' : 'Da rimborsare'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {extraRimborso.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Spese Extra</h4>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {extraRimborso.map(ar => (
                <li key={`rimborso-extra-${ar.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px dashed #e5e7eb', opacity: ar.rimborsato ? 0.6 : 1 }}>
                  <div>
                    <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>👤 {getNomePasseggero(ar)}</span><br/>
                    Descrizione: <strong>{ar.descrizione}</strong> <br/>
                    Importo: <strong>€{Number(ar.importo || 0).toFixed(2)}</strong>
                  </div>
                  <div>
                    <button 
                      onClick={() => gestisciAltroRimborso(ar.id, !ar.rimborsato)} 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: ar.rimborsato ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '130px' }}
                    >
                      {ar.rimborsato ? 'Rimborsato' : 'Da rimborsare'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <hr style={{ margin: '2rem 0 1.5rem 0', border: 'none', borderTop: '2px dashed var(--border)' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formExtra.aperto ? '1rem' : '0' }}>
          <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Altre Spese Extra</h4>
          <button 
            onClick={() => setFormExtra({ ...formExtra, aperto: !formExtra.aperto })}
            style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {formExtra.aperto ? 'Annulla' : '+ Aggiungi Spesa Extra'}
          </button>
        </div>

        {formExtra.aperto && (
          <form onSubmit={aggiungiSpesaExtra} style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <strong>Ospite associato alla spesa:</strong>
              <select required value={formExtra.id_selezionato} onChange={(e) => setFormExtra({...formExtra, id_selezionato: e.target.value})} style={{ width: '100%', marginTop: '0.25rem' }}>
                <option value="">-- Seleziona a chi rimborsare --</option>
                {opzioniAssegnatari.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ flex: 2 }}>
                <strong>Descrizione:</strong>
                <input type="text" placeholder="Es: Taxi, Pasto extra, Bagaglio..." required value={formExtra.descrizione} onChange={(e) => setFormExtra({...formExtra, descrizione: e.target.value})} style={{ width: '100%', marginTop: '0.25rem' }} />
              </label>
              <label style={{ flex: 1 }}>
                <strong>Importo (€):</strong>
                <input type="number" step="0.01" min="0.01" required value={formExtra.importo} onChange={(e) => setFormExtra({...formExtra, importo: e.target.value})} style={{ width: '100%', marginTop: '0.25rem' }} />
              </label>
            </div>
            <button type="submit" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Salva Spesa Extra
            </button>
          </form>
        )}

        {(totaleComplessivo > 0) && (
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
            {totaleAlloggi > 0 && <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Totale alloggi da saldare: €{totaleAlloggi.toFixed(2)}</span>}
            {totaleBiglietti > 0 && <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Totale biglietti da saldare: €{totaleBiglietti.toFixed(2)}</span>}
            {totaleExtra > 0 && <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Totale extra da saldare: €{totaleExtra.toFixed(2)}</span>}
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem', fontWeight: '600' }}>Totale Ancora Da Rimborsare:</span>
              <strong style={{ fontSize: '1.6rem', color: '#ef4444' }}>€{totaleComplessivo.toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}